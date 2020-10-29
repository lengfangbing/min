export function getRequestType(contentType: string) {
  const typeRes = {
    isText: false,
    isUrlencoded: false,
    isJson: false,
    isFormData: false,
  };
  s: {
    if (contentType.includes("application/json")) {
      typeRes.isJson = true;
      break s;
    }
    if (contentType.includes("application/x-www-form-urlencoded")) {
      typeRes.isUrlencoded = true;
      break s;
    }
    if (contentType.includes("multipart/form-data")) {
      typeRes.isFormData = true;
      break s;
    }
    if (contentType.includes("text")) {
      typeRes.isText = true;
      break s;
    }
  }
  return typeRes;
}
