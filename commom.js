import { writeFileSync, existsSync, readFileSync, rmSync } from "fs";
import AdmZip from "adm-zip";

const projectsJsonFile = "./projects.json";

export const writeProjectsJson = (repos) => {
  const reposString = JSON.stringify(repos, null, 2);
  writeFileSync(projectsJsonFile, reposString);
};

export const readProjectsJson = () => {
  if (!existsSync(projectsJsonFile)) {
    return {};
  }
  const reposString = readFileSync(projectsJsonFile);
  return JSON.parse(reposString);
};

export const writeAndUnzipBuffer = (buffer, targetDir) => {
  const timeStamp = new Date();
  const zipFilePath = `${targetDir}${timeStamp}.zip`;
  writeFileSync(zipFilePath, buffer);
  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo(targetDir, true);
  rmSync(zipFilePath);
};

export const asyncFilter = async (array, callback) => {
  const results = await Promise.all(
    array.map(async (item) => ({
      item,
      isValid: await callback(item),
    }))
  );

  return results.filter(({ isValid }) => isValid).map(({ item }) => item);
};
