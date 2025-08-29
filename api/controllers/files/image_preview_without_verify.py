
from flask import Response
from flask_restx import Resource

import services
from controllers.common.errors import UnsupportedFileTypeError
from controllers.files import files_ns
from services.file_service import FileService


@files_ns.route("/<uuid:file_id>/file-preview-anonymous")
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
