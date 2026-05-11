type MatchedFileLike = {
  id: string;
  name: string;
};

const MATCHED_FILE_SEPARATOR = "::";

export function createMatchedFileRef(file: MatchedFileLike) {
  return `${file.id}${MATCHED_FILE_SEPARATOR}${encodeURIComponent(file.name)}`;
}

export function readMatchedFileId(fileRef: string) {
  const separatorIndex = fileRef.indexOf(MATCHED_FILE_SEPARATOR);

  return separatorIndex === -1 ? undefined : fileRef.slice(0, separatorIndex);
}

export function readMatchedFileDisplayName(fileRef: string) {
  const separatorIndex = fileRef.indexOf(MATCHED_FILE_SEPARATOR);

  if (separatorIndex === -1) {
    return fileRef;
  }

  const encodedName = fileRef.slice(separatorIndex + MATCHED_FILE_SEPARATOR.length);

  try {
    return decodeURIComponent(encodedName);
  } catch {
    return encodedName;
  }
}

export function compareMatchedFiles(left: string, right: string) {
  const byName = readMatchedFileDisplayName(left).localeCompare(readMatchedFileDisplayName(right));

  return byName || left.localeCompare(right);
}