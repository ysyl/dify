from urllib.parse import quote

from flask import Response, request
from flask_restful import Resource, reqparse  # type: ignore

import services
from controllers.files import api
from controllers.files.error import UnsupportedFileTypeError
from services.file_service import FileService


class FilePreviewAnonymousApi(Resource):
    def get(self, file_id):
        file_id = str(file_id)

        try:
            generator, upload_file = FileService.get_file_generator_by_file_id_without_verify(
                file_id=file_id
            )
        except services.errors.file.UnsupportedFileTypeError:
            raise UnsupportedFileTypeError()

        response = Response(
            generator,
            mimetype=upload_file.mime_type,
            direct_passthrough=True,
            headers={},
        )
        if upload_file.size > 0:
            response.headers["Content-Length"] = str(upload_file.size)

        return response

api.add_resource(FilePreviewAnonymousApi, "/files/<uuid:file_id>/file-preview-anonymous")
