import logging
from collections.abc import Sequence
from typing import Optional

from bleach.sanitizer import Cleaner
from bs4 import BeautifulSoup, Comment

from core.app.app_config.features.file_upload.manager import FileUploadConfigManager
from core.file import file_manager
from core.model_manager import ModelInstance
from core.model_runtime.entities import (
    AssistantPromptMessage,
    ImagePromptMessageContent,
    PromptMessage,
    PromptMessageRole,
    TextPromptMessageContent,
    UserPromptMessage,
)
from core.model_runtime.entities.message_entities import PromptMessageContentUnionTypes
from core.prompt.utils.extract_thread_messages import extract_thread_messages
from extensions.ext_database import db
from factories import file_factory
from models.model import AppMode, Conversation, Message, MessageFile
from models.workflow import WorkflowRun

logger = logging.getLogger(__name__)

class AllowedHTMLElements:
    @staticmethod
    def get_allowed_tags():
        """返回允许的HTML标签列表"""
        return [
            'a', 'abbr', 'acronym', 'b', 'blockquote', 'br', 'code', 'dd', 'del', 'div', 
            'dl', 'dt', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 
            'ins', 'kbd', 'li', 'ol', 'p', 'pre', 'q', 'samp', 'small', 'span', 'strike', 
            'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 
            'tt', 'u', 'ul', 'var'
        ]

    @staticmethod
    def get_allowed_attributes():
        """返回允许的HTML属性列表"""
        return {
            'a': ['href', 'title', 'target', 'rel'],
            'img': ['src', 'alt', 'title', 'width', 'height', 'loading'],
            'div': ['class', 'style'],
            'span': ['class', 'style'],
            'p': ['class', 'style'],
            'pre': ['class'],
            'blockquote': ['cite'],
            'table': ['border', 'cellpadding', 'cellspacing'],
            '*': ['class', 'id', 'style']  # 允许所有标签的class和id属性
        }

class TokenBufferMemory:
    def __init__(self, conversation: Conversation, model_instance: ModelInstance) -> None:
        self.conversation = conversation
        self.model_instance = model_instance
        self.html_cleaner = self._create_html_cleaner()

    def _create_html_cleaner(self) -> Cleaner:
        """创建安全的HTML清理器配置"""
        # 定义允许的HTML标签和属性
        allowed_tags = AllowedHTMLElements.get_allowed_tags()  # 假设这里定义了安全的标签列表
        allowed_attributes = AllowedHTMLElements.get_allowed_attributes()  # 假设这里定义了安全的属性列表
        
        return Cleaner(
            tags=allowed_tags,
            attributes=allowed_attributes,
            protocols=['http', 'https', 'mailto'],
            strip=True,
            strip_comments=True
        )

    def _filter_html_no_memory(self, text: str) -> str:
        """安全地过滤掉包含no_memory=true属性的HTML标签，并防止XSS"""
        if not text:
            return text

        # 第一步：使用BeautifulSoup移除no_memory标签
        soup = BeautifulSoup(text, 'html.parser')
        
        # 移除所有包含no_memory="true"的标签
        for tag in soup.find_all(attrs={"no-memory": "true"}):
            tag.decompose()
            
        # 移除HTML注释，防止注释中隐藏恶意代码
        for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
            comment.extract()
        
        # 转换BeautifulSoup对象为字符串
        cleaned_html = str(soup)
        
        # 第二步：使用bleach进行XSS清理
        safe_text = self.html_cleaner.clean(cleaned_html)
        return safe_text

    def _process_message_content(self, content: str) -> str:
        """处理消息内容，过滤不需要的HTML标签并防止XSS"""
        # 处理HTML内容
        if '<' in content and '>' in content:
            content = self._filter_html_no_memory(content)
            
        return content

    def get_history_prompt_messages(
        self, max_token_limit: int = 2000, message_limit: Optional[int] = None
    ) -> Sequence[PromptMessage]:
        """
        Get history prompt messages.
        :param max_token_limit: max token limit
        :param message_limit: message limit
        """
        app_record = self.conversation.app

        # fetch limited messages, and return reversed
        query = (
            db.session.query(
                Message.id,
                Message.query,
                Message.answer,
                Message.created_at,
                Message.workflow_run_id,
                Message.parent_message_id,
                Message.answer_tokens,
            )
            .filter(
                Message.conversation_id == self.conversation.id,
            )
            .order_by(Message.created_at.desc())
        )

        if message_limit and message_limit > 0:
            message_limit = min(message_limit, 500)
        else:
            message_limit = 500

        messages = query.limit(message_limit).all()

        # instead of all messages from the conversation, we only need to extract messages
        # that belong to the thread of last message
        thread_messages = extract_thread_messages(messages)

        # for newly created message, its answer is temporarily empty, we don't need to add it to memory
        if thread_messages and not thread_messages[0].answer and thread_messages[0].answer_tokens == 0:
            thread_messages.pop(0)

        messages = list(reversed(thread_messages))

        prompt_messages: list[PromptMessage] = []
        for message in messages:
            logger.info(f"消息 JSON 结构: {message._fields}")
            processed_answer = self._process_message_content(message.answer)
            files = db.session.query(MessageFile).filter(MessageFile.message_id == message.id).all()
            if files:
                file_extra_config = None
                if self.conversation.mode not in {AppMode.ADVANCED_CHAT, AppMode.WORKFLOW}:
                    file_extra_config = FileUploadConfigManager.convert(self.conversation.model_config)
                else:
                    if message.workflow_run_id:
                        workflow_run = (
                            db.session.query(WorkflowRun).filter(WorkflowRun.id == message.workflow_run_id).first()
                        )

                        if workflow_run and workflow_run.workflow:
                            file_extra_config = FileUploadConfigManager.convert(
                                workflow_run.workflow.features_dict, is_vision=False
                            )

                detail = ImagePromptMessageContent.DETAIL.LOW
                if file_extra_config and app_record:
                    file_objs = file_factory.build_from_message_files(
                        message_files=files, tenant_id=app_record.tenant_id, config=file_extra_config
                    )
                    if file_extra_config.image_config and file_extra_config.image_config.detail:
                        detail = file_extra_config.image_config.detail
                else:
                    file_objs = []

                if not file_objs:
                    prompt_messages.append(UserPromptMessage(content=message.query))
                else:
                    prompt_message_contents: list[PromptMessageContentUnionTypes] = []
                    prompt_message_contents.append(TextPromptMessageContent(data=message.query))
                    for file in file_objs:
                        prompt_message = file_manager.to_prompt_message_content(
                            file,
                            image_detail_config=detail,
                        )
                        prompt_message_contents.append(prompt_message)

                    prompt_messages.append(UserPromptMessage(content=prompt_message_contents))

            else:
                prompt_messages.append(UserPromptMessage(content=message.query))

            prompt_messages.append(AssistantPromptMessage(content=processed_answer))

        if not prompt_messages:
            return []

        # prune the chat message if it exceeds the max token limit
        curr_message_tokens = self.model_instance.get_llm_num_tokens(prompt_messages)

        if curr_message_tokens > max_token_limit:
            pruned_memory = []
            while curr_message_tokens > max_token_limit and len(prompt_messages) > 1:
                pruned_memory.append(prompt_messages.pop(0))
                curr_message_tokens = self.model_instance.get_llm_num_tokens(prompt_messages)

        return prompt_messages

    def get_history_prompt_text(
        self,
        human_prefix: str = "Human",
        ai_prefix: str = "Assistant",
        max_token_limit: int = 2000,
        message_limit: Optional[int] = None,
    ) -> str:
        """
        Get history prompt text.
        :param human_prefix: human prefix
        :param ai_prefix: ai prefix
        :param max_token_limit: max token limit
        :param message_limit: message limit
        :return:
        """
        prompt_messages = self.get_history_prompt_messages(max_token_limit=max_token_limit, message_limit=message_limit)

        string_messages = []
        for m in prompt_messages:
            if m.role == PromptMessageRole.USER:
                role = human_prefix
            elif m.role == PromptMessageRole.ASSISTANT:
                role = ai_prefix
            else:
                continue

            if isinstance(m.content, list):
                inner_msg = ""
                for content in m.content:
                    if isinstance(content, TextPromptMessageContent):
                        inner_msg += f"{content.data}\n"
                    elif isinstance(content, ImagePromptMessageContent):
                        inner_msg += "[image]\n"

                string_messages.append(f"{role}: {inner_msg.strip()}")
            else:
                message = f"{role}: {m.content}"
                string_messages.append(message)

        return "\n".join(string_messages)
