import { API } from "../auth/axios";
import type { CV, CvVisibility } from "./cv.types";

export async function getMyCv() {
    const response = await API.get<CV>('/cv/me');
    return response.data;
}


export async function uploadCv(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await API.post<CV>('/cv/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
}

export async function updateCvVisibility(visibility: CvVisibility) {
    const response = await API.patch<CV>('/cv/visibility', {
        visibility,
    });

    return response.data;
}

export async function deleteMyCv() {
  const response = await API.delete<{ message: string }>('/cv/me');
  return response.data;
}