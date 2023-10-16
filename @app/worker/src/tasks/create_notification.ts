import { Task } from "graphile-worker";

const rootUrl = process.env.ROOT_URL;

if (!rootUrl || typeof rootUrl !== "string") {
  throw new Error("Envvar ROOT_URL is required.");
}

type CreateNotificationPayload =
  | {
      type: "pupcle_reward_mission";

      for_user_id: string;

      reward: number;
      balance: number;

      mission_id: string;
    }
  | {
      type: "pupcle_reward_daily_status";

      for_user_id: string;

      reward: number;
      balance: number;

      pet_id: string;
      day: string;
    }
  | {
      type: "received_friend_request";

      for_user_id: string;

      from_user_id: string;
    }
  | {
      type: "received_mission_invite";

      for_user_id: string;

      from_user_id: string;

      mission_id: string;
    };
// exam_appointment_reminder

const task: Task = async (
  rawPayload,
  { addJob: _addJob, withPgClient, job: _job }
) => {
  // TODO: use addJob to create an email/mobile/etc notification

  const payload: CreateNotificationPayload = rawPayload as any;

  const {
    rows: [forUser],
  } = await withPgClient((client) =>
    client.query("select * from app_public.users where id = $1", [
      payload.for_user_id,
    ])
  );

  if (!forUser) {
    throw new Error("Could not find user");
  }

  const user_id = forUser.id;
  let category: string;
  let message: string;
  let action_url: string | null = null;
  // expires_at

  switch (payload.type) {
    case "pupcle_reward_mission": {
      const {
        rows: [mission],
      } = await withPgClient((client) =>
        client.query("select * from app_public.missions where id = $1", [
          payload.mission_id,
        ])
      );

      category = "펍클 적립 안내";
      message = `${mission.name} 미션으로 ${payload.reward}펍클이 적립되었습니다. 현재 펍클: ${payload.balance}`;
      action_url = null; // can't link to old mission right now

      break;
    }
    case "pupcle_reward_daily_status": {
      const {
        rows: [pet],
      } = await withPgClient((client) =>
        client.query("select * from app_public.pets where id = $1", [
          payload.pet_id,
        ])
      );

      category = "펍클 적립 안내";
      // payload.day is like 2023-10-16
      message = `소중한 반려견 ${pet.name}의 ${payload.day} 일일기록 완료로 ${payload.reward}펍클이 적립되었습니다. 현재 펍클: ${payload.balance}`;
      action_url = `${rootUrl}/calendar/pet/${payload.pet_id}/day/${payload.day}`;
      break;
    }
    case "received_friend_request": {
      const {
        rows: [fromUser],
      } = await withPgClient((client) =>
        client.query("select * from app_public.users where id = $1", [
          payload.from_user_id,
        ])
      );

      category = "친구 신청 안내";
      message = `${fromUser.nickname} 님이 친구신청을 보냈습니다.`;
      action_url = `${rootUrl}/friends?tab=friends`;
      break;
    }
    case "received_mission_invite": {
      const {
        rows: [mission],
      } = await withPgClient((client) =>
        client.query("select * from app_public.missions where id = $1", [
          payload.mission_id,
        ])
      );

      const {
        rows: [fromUser],
      } = await withPgClient((client) =>
        client.query("select * from app_public.users where id = $1", [
          payload.from_user_id,
        ])
      );

      category = "mission invite";
      message = `${fromUser.nickname} 님이 ${mission.name} 미션에 초대했습니다.`;
      action_url = `${rootUrl}/friends?tab=missions`;
      break;
    }
    default: {
      const neverPayload: never = payload;
      console.error(
        `Create notification action '${
          (neverPayload as any).type
        }' not understood; ignoring.`
      );
      return;
    }
  }

  await withPgClient((client) =>
    client.query(
      "insert into app_public.notifications (user_id, category, message, action_url) values ($1, $2, $3, $4)",
      [user_id, category, message, action_url]
    )
  );
};

export default task;
