import axiosClient from './axiosClient';

export const uploadApi = {
  uploadSingle: (file: File, folder: string) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", folder);
    return axiosClient.post("/upload/single", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadMultiple: (files: File[], folder: string) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    formData.append("folder", folder);
    return axiosClient.post("/upload/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadPdf: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "host-applications");
    return axiosClient.post("/upload/pdf", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
