import os
import logging
from typing import Optional, Tuple, BinaryIO
from app.core.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.is_s3_enabled = bool(
            settings.S3_BUCKET_NAME and
            settings.S3_ACCESS_KEY_ID and
            settings.S3_SECRET_ACCESS_KEY
        )
        self.s3_client = None
        if self.is_s3_enabled:
            try:
                import boto3
                client_kwargs = {
                    "aws_access_key_id": settings.S3_ACCESS_KEY_ID,
                    "aws_secret_access_key": settings.S3_SECRET_ACCESS_KEY,
                    "region_name": settings.S3_REGION_NAME or "auto",
                }
                if settings.S3_ENDPOINT_URL:
                    client_kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
                self.s3_client = boto3.client("s3", **client_kwargs)
                logger.info(f"S3/R2 Cloud Storage initialized with bucket '{settings.S3_BUCKET_NAME}'.")
            except Exception as e:
                logger.error(f"Failed to initialize S3 client: {e}. Falling back to local disk storage.")
                self.is_s3_enabled = False

    def save_file(self, file_bytes: bytes, filename: str, content_type: str = "application/pdf") -> str:
        """
        Saves file to Cloud Object Storage (R2/S3) if configured, or local uploads directory.
        Returns the persistent storage identifier or path.
        """
        if self.is_s3_enabled and self.s3_client:
            s3_key = f"documents/{filename}"
            try:
                self.s3_client.put_object(
                    Bucket=settings.S3_BUCKET_NAME,
                    Key=s3_key,
                    Body=file_bytes,
                    ContentType=content_type
                )
                logger.info(f"Successfully uploaded {filename} to cloud object storage (key: {s3_key})")
                return f"s3://{settings.S3_BUCKET_NAME}/{s3_key}"
            except Exception as e:
                logger.error(f"Failed to upload to S3: {e}. Falling back to local disk.")

        # Local disk fallback
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        local_path = os.path.join(settings.UPLOAD_DIR, filename)
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        return local_path

    def get_file_bytes(self, storage_path: str) -> Optional[bytes]:
        """
        Retrieves file bytes from S3/R2 or local filesystem.
        """
        if storage_path.startswith("s3://") and self.s3_client:
            try:
                parts = storage_path[5:].split("/", 1)
                bucket = parts[0]
                key = parts[1]
                response = self.s3_client.get_object(Bucket=bucket, Key=key)
                return response["Body"].read()
            except Exception as e:
                logger.error(f"Failed to read file from S3 ({storage_path}): {e}")
                return None

        # Local filesystem read
        if os.path.exists(storage_path):
            with open(storage_path, "rb") as f:
                return f.read()

        logger.warning(f"File not found on local disk or S3: {storage_path}")
        return None

    def delete_file(self, storage_path: str) -> bool:
        """
        Deletes file from S3/R2 or local disk.
        """
        if storage_path.startswith("s3://") and self.s3_client:
            try:
                parts = storage_path[5:].split("/", 1)
                bucket = parts[0]
                key = parts[1]
                self.s3_client.delete_object(Bucket=bucket, Key=key)
                return True
            except Exception as e:
                logger.error(f"Failed to delete file from S3 ({storage_path}): {e}")
                return False

        if os.path.exists(storage_path):
            try:
                os.remove(storage_path)
                return True
            except Exception:
                return False
        return True

storage_service = StorageService()

