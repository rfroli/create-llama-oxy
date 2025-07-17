import { useState } from "react";
import { Button } from "../button";
import FileUploader from "../file-uploader";
import { Input } from "../input";
import UploadImagePreview from "../upload-image-preview";
import { ChatHandler } from "./chat.interface";

export default function ChatInput(
  props: Pick<
    ChatHandler,
    | "isLoading"
    | "input"
    | "onFileUpload"
    | "onFileError"
    | "handleSubmit"
    | "handleInputChange"
  > & {
    multiModal?: boolean;
  },
) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (imageUrl) {
      props.handleSubmit(e, {
        data: { imageUrl: imageUrl },
      });
      setImageUrl(null);
      return;
    }
    props.handleSubmit(e);
  };

  const onRemovePreviewImage = () => setImageUrl(null);

  const handleUploadImageFile = async (file: File) => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
    setImageUrl(base64);
  };

  const handleUploadFile = async (file: File) => {
    try {
      if (props.multiModal && file.type.startsWith("image/")) {
        return await handleUploadImageFile(file);
      }
      props.onFileUpload?.(file);
    } catch (error: any) {
      props.onFileError?.(error.message);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg sm:rounded-xl bg-white p-2 sm:p-4 shadow-xl space-y-2 sm:space-y-4"
    >
      {imageUrl && (
        <UploadImagePreview url={imageUrl} onRemove={onRemovePreviewImage} />
      )}
      <div className="flex w-full items-start justify-between gap-2 sm:gap-4">
        <Input
          autoFocus
          name="message"
          placeholder="Saisissez votre question sur la comptabilité"
          className="flex-1"
          value={props.input}
          onChange={props.handleInputChange}
        />
        <div className="hidden sm:block">
          <FileUploader
            onFileUpload={handleUploadFile}
            onFileError={props.onFileError}
          />
        </div>
        <Button 
          type="submit" 
          disabled={props.isLoading}
          className="px-3 sm:px-4 text-sm"
          size="default"
        >
          <span className="hidden sm:inline">Send message</span>
          <span className="sm:hidden">OK</span>
        </Button>
      </div>
    </form>
  );
}
