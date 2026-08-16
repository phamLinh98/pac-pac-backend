import assert from "node:assert/strict";
import test from "node:test";

import { getListStatusAllUserViaId } from "../models/listModel.js";

test("home feed includes login user, accepted friends and legacy friends", () => {
  const cursor = {
    createdAt: "2026-08-16T10:00:00.000Z",
    id: 99,
  };

  const { query, values } = getListStatusAllUserViaId(7, cursor, 11);

  assert.match(query, /SELECT id AS user_id\s+FROM logged_in_user/);
  assert.doesNotMatch(query, /WITH\s+current_user\s+AS/i);
  assert.match(query, /UNNEST\([\s\S]*list_friend_id/);
  assert.match(query, /friend_request\.status = 'accepted'/);
  assert.match(query, /friend_request\.delete_flg = 0/);
  assert.match(query, /JOIN list AS l\s+ON l\.user_id = feed_user_ids\.user_id/);
  assert.deepEqual(values, [7, cursor.createdAt, cursor.id, 11]);
});

test("home feed keeps stable cursor pagination and soft-delete filters", () => {
  const { query, values } = getListStatusAllUserViaId(7, null, 11);

  assert.match(query, /\(l\.created_at, l\.id\) < \(\$2::timestamptz, \$3::bigint\)/);
  assert.match(query, /ORDER BY l\.created_at DESC, l\.id DESC/);
  assert.match(query, /LIMIT \$4/);
  assert.match(query, /l\.delete_flg = 0/);
  assert.match(query, /friend_user\.delete_flg = 0/);
  assert.deepEqual(values, [7, null, null, 11]);
});
