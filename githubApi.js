import "dotenv/config";
import { Octokit } from "octokit";

const token = process.env.GITHUB_ACCESS_TOKEN;

const octokit = new Octokit({
  auth: token,
});

export const getReposByLanguage = async (language, perPage) => {
  const response = await octokit.request("GET /search/repositories", {
    q: `language:${language}`,
    sort: "stars",
    order: "desc",
    per_page: perPage,
  });
  const repos = response.data.items;
  return repos;
};

export const getLanguagePercentagesByRepo = async (repoFullName) => {
  const response = await octokit.request(
    `GET /repos/${repoFullName}/languages`
  );
  const linesPerLanguage = response.data;
  const languages = Object.keys(linesPerLanguage);

  let totalLines = 0;
  languages.forEach((language) => (totalLines += linesPerLanguage[language]));

  return Object.fromEntries(
    languages.map((language) => [
      language,
      (linesPerLanguage[language] / totalLines).toFixed(2) * 100,
    ])
  );
};

export const getNumOfContributorsByRepo = async (repoFullName) => {
  const response = await octokit.request(
    `GET /repos/${repoFullName}/contributors`
  );
  const contributors = response.data;
  return contributors.length;
};

export const getRepoBuffer = async (repoFullName) => {
  const response = await octokit.request(`GET /repos/${repoFullName}/zipball`, {
    responseType: "arraybuffer",
  });
  const repoZipBuffer = Buffer.from(response.data);
  return repoZipBuffer;
};
