import { addDays, format } from "date-fns";
import { Task } from "graphile-worker";

const dailyMissionTemplates = [
  {
    name: "산책하기",
    description:
      "반려견에게 산책은 필수!\n내 소중한 반려견과 산책을 하고, 사진을 찍어 인증해주세요!\n\n인증 완료시 2펍클 지급",
    keywords: ["목줄", "야외"],
    required_objects: ["dog"],
    reward: 2,
  },
  {
    name: "물 갈아주기",
    description:
      "반려견도 깨끗하고 신선한 물을 좋아해요!\n내 소중한 반려견의 물그릇을 갈아주고, 사진을 찍어 인증해주세요!\n물그릇을 씻어주는 것도 잊지 말기!\n\n인증 완료시 1펍클 지급",
    keywords: ["그릇", "물"],
    required_objects: ["dog", "bowl"],
    reward: 1,
  },
  {
    name: "쓰다듬기",
    description:
      "반려견의 심리적 안정, 그리고 나와의 신뢰 관계 구축을 위해 필요한 스킨십!\n내 소중한 반려견을 쓰다듬고, 사진을 찍어 인증해주세요!\n여기서 잠깐! 머리를 쓰다듬는 건 반려견이 좋아하지 않아요. 머리보다는 등과 허리, 귀, 턱밑 등 반려견이 좋아하는 부위를 쓰다듬어 주세요!\n또, 그날의 컨디션에 따라 반려견이 원치 않을 수도 있으니 반려견의 상태와 기분을 잘 살펴보고 진행해주세요.\n\n인증 완료시 1펍클 지급",
    keywords: ["쓰다듬는 손"],
    required_objects: ["dog"],
    reward: 1,
  },
  {
    name: "양치하기",
    description:
      "반려견의 구강 건강을 위해 양치는 선택이 아닌 필수입니다.\n내 소중한 반려견에게 양치를 시켜주고, 사진을 찍어 인증해주세요!\n\n인증 완료시 1펍클 지급",
    keywords: ["칫솔", "치약"],
    required_objects: ["dog"],
    reward: 1,
  },
  {
    name: "목욕하기",
    description:
      "반려견의 피부 질환을 예방할 수 있는 목욕!\n내 소중한 반려견을 목욕시키고, 사진을 찍어 인증해주세요!\n반려견의 목욕 주기는 평균적으로 2주~4주입니다.\n잦은 목욕은 오히려 반려견에게 해가 된다는 점 잊지 말기!\n\n인증 완료시 3펍클 지급",
    keywords: ["물", "샤워기"],
    required_objects: ["dog"],
    reward: 3,
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
      "insert into app_public.missions (name, description, keywords, reward, period, day, required_objects) select name, description, keywords, reward, period, day, required_objects from json_to_recordset($1) as x(name text, description text, keywords text[], reward int, period text, day date, required_objects text[]) on conflict do nothing",
      [JSON.stringify(missions)]
    )
  );
};

export default task;
