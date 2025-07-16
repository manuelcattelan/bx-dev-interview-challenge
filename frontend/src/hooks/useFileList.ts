import { useState, useEffect, useCallback } from "react";
import filesService, { File } from "../services/files";

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
      setUserFilesError("Failed to load files");
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
