from flask import Blueprint

from libs.external_api import ExternalApi

bp = Blueprint("files", __name__)
api = ExternalApi(bp)


from . import image_preview, image_preview_without_verify, tool_files, upload
