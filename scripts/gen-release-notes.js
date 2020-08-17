const execa = require('execa');
const moment = require("moment");
const _ = require("lodash");
const YAML = require('yamljs');
const fs = require("fs-extra");
const { parseCommit } = require('parse-commit-message');



async function gitLogs(repoPath) {
    const gitTagCmd = `git describe --abbrev=0 --tags`;
    const { stdout: gitTag } = await execa.command(gitTagCmd, { cwd: repoPath, shell: true })
    console.log(gitTag)
    // v0.5.13
    const [major, minor, patch] = gitTag.split(".");
    const gitTagAnchor = `${major}.${minor}.0`;
    console.log(gitTagAnchor)
    const command = `git log ${gitTagAnchor}..HEAD --format=\'%C(auto) %h %s\'`;
    const out = await execa.command(command, { cwd: repoPath, shell: true })
    // const re = new RegExp(/(?<type>(^[:\(])+)?)(\((?<topic>.+)\))?:?/);
    // const parser = conventionalCommitsParser();
    // sync()
    const commits = out.stdout.split("\n").map(line => {
        // const out = sync(_.trim(line));
        console.log(line);
        const [skip, chash, ...ccommit] = line.split(" ")
        console.log(ccommit);
        const tmp = ccommit.join(" ");
        console.log(tmp);
        const out = parseCommit(tmp);
        const {type: ctype, scope: topic, subject: cmsg} = out.header;
        // const match = re.exec(ctype);
        // const {type, topic}  = match.groups
        // return { chash, ctype: type, topic, cmsg: cmsg.join(" ") }
        return {chash, ctype, topic, cmsg}
    })
    const tag = { major, minor, patch }
    return { commits, tag };
}

async function cleanCommits(commits) {
    return _.reject(commits, ent => {
        return _.some(["chore", "docs", "spike", "tests", "refactor", "invest"], bad => ent.ctype.startsWith(bad))
    });
}

function addExtraFields(commits) {
    return commits.map(c => {
        return _.defaults(c, { topic: "", desc: "", tags: [] })
    })
}

async function main() {
    const stats = {
        numCommits: 0
    };
    const { commits, tag } = await gitLogs('/Users/kevinlin/projects/dendronv2/dendron');
    stats.numCommits = commits.length;
    const commitsClean = await cleanCommits(commits);
    const yamlString = YAML.stringify(addExtraFields(commitsClean), 4);
    console.log(commitsClean)
    const tagName = [tag.major, tag.minor, tag.patch].join(".");
    fs.writeFileSync(`data/${tagName}.yml`, yamlString)
}

const sections = {
    commands: {},
    notes: {},
    other: {},
    pods: {},
    schemas: {},
    workspace: {},
}

main();