import {
  mkdirSync,
  rmSync,
  existsSync,
  readdirSync,
  statSync,
  renameSync,
} from "fs";
import { writeAndUnzipBuffer, writeProjectsJson, asyncFilter } from "./commom";
import {
  getLanguagePercentagesByRepo,
  getNumOfContributorsByRepo,
  getRepoBuffer,
  getReposByLanguage,
} from "./githubApi";

const LANGUAGES = {
  Java: "Java",
};

const percentageToBeValid = 90;

const numOfRepos = 3;

const reposDir = "./projects";

const clearDir = (dirPath) => {
  if (existsSync(dirPath)) {
    rmSync(dirPath, { recursive: true });
  }
  mkdirSync(dirPath, { recursive: true });
};

const hasEnoughJava = async (repo) => {
  const languagePrecentages = getLanguagePercentagesByRepo(repo.full_name);

  return (
    Object.keys(languagePrecentages).includes(LANGUAGES.Java) &&
    languagePrecentages[LANGUAGES.Java] >= percentageToBeValid
  );
};

const downloadAndUnzipRepo = async (repo) => {
  const repoZipBuffer = await getRepoBuffer(repo.full_name);

  writeAndUnzipBuffer(repoZipBuffer, reposDir);

  // rename to be name of repo
  const newRepoPath = `${reposDir}/${repo.name}`;
  const filePrefix = repo.full_name.replace("/", "-");
  const oldRepoName = readdirSync(reposDir).find((file) =>
    file.startsWith(filePrefix)
  );
  const oldRepoPath = `${reposDir}/${oldRepoName}`;
  renameSync(oldRepoPath, newRepoPath);
};

const removeRepo = (repo) => {
  const repoPath = `${reposDir}/${repo.name}`;
  rmSync(repoPath, { recursive: true });
};

const hasJavaFile = (repo) => {
  const repoPath = `${reposDir}/${repo.name}`;
  const javaFileRegex = /\.java$/i;

  let fileFound = false;
  const findFile = (path) => {
    if (fileFound) return;

    if (statSync(path).isFile()) {
      if (javaFileRegex.test(path)) {
        fileFound = true;
      }
      return;
    }

    readdirSync(path).forEach((subPath) => findFile(`${path}/${subPath}`));
  };

  findFile(repoPath);

  if (!fileFound) {
    console.log(repo.name, "has no java files");
    removeRepo(repo);
  }

  return fileFound;
};

const getReposWithContribs = async (repos) =>
  Object.fromEntries(
    await Promise.all(
      repos.map(async (repo) => [
        repo.name,
        {
          contributors: await getNumOfContributorsByRepo(repo.full_name),
          clone_url: repo.clone_url,
        },
      ])
    )
  );

const main = async () => {
  clearDir(reposDir);

  const repos = await getReposByLanguage(LANGUAGES.Java, numOfRepos);

  const filteredRepos = await asyncFilter(repos, hasEnoughJava);

  await Promise.all(
    filteredRepos.map(async (repo) => await downloadAndUnzipRepo(repo))
  );

  const filteredRepos2 = await asyncFilter(filteredRepos, hasJavaFile);

  const reposWithContribs = getReposWithContribs(filteredRepos2);

  writeProjectsJson(reposWithContribs);
};

main();
