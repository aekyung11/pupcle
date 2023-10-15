import { addDays, format } from "date-fns";
import { Task } from "graphile-worker";

const dailyMissionTemplates = [
  {
    name: "산책하기",
    description:
      "반려견에게 산책은 필수!\n내 소중한 반려견과 산책을 하고, 사진을 찍어 인증해주세요!\n인증 완료시 2펍클 지급",
    keywords: ["목줄", "야외"],
    reward: 2,
  },
  {
    name: "물 갈아주기",
    description: "물 갈아주기 description",
    keywords: ["물 갈아주기 keyword 1", "물 갈아주기 keyword 2"],
    reward: 2,
  },
  {
    name: "쓰다듬기",
    description: "쓰다듬기 description",
    keywords: ["쓰다듬기 keyword 1", "쓰다듬기 keyword 2"],
    reward: 2,
  },
  {
    name: "양치하기",
    description: "양치하기 description",
    keywords: ["양치하기 keyword 1", "양치하기 keyword 2"],
    reward: 2,
  },
  {
    name: "목욕하기",
    description: "목욕하기 description",
    keywords: ["목욕하기 keyword 1", "목욕하기 keyword 2"],
    reward: 2,
  },
];

const task: Task = async (_payload, { withPgClient, job }) => {
  const dayDeltas = [-3, -2, -1, 0, 1, 2, 3];
  const dates = dayDeltas.map((d) => addDays(job.created_at, d));
  const formattedDates = dates.map((d) => format(d, "yyyy-MM-dd"));
  const missions = dailyMissionTemplates
    .map((template) => {
      return formattedDates.map((day) => ({
        ...template,
        period: "DAILY", // MissionPeriodKind
        day,
      }));
    })
    .flat();

  await withPgClient((client) =>
    client.query(
      "insert into app_public.missions (name, description, keywords, reward, period, day) select name, description, keywords, reward, period, day from json_to_recordset($1) as x(name text, description text, keywords text[], reward int, period text, day date) on conflict do nothing",
      [JSON.stringify(missions)]
    )
  );
};

export default task;
