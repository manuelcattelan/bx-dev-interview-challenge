import { useState, useEffect, useCallback } from "react";
import filesService, { File } from "../services/files";
import { getErrorMessage } from "../utils/errors";

export const useFileList = () => {
  const [userFiles, setUserFiles] = useState<File[]>([]);
  const [userFilesError, setUserFilesError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getUserFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setUserFilesError(null);

      const fileList = await filesService.getFiles();

      setUserFiles(fileList.files);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setUserFilesError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getUserFiles();
  }, [getUserFiles]);

  return {
    userFiles,
    userFilesError,
    getUserFiles,
    isLoading,
  };
};
