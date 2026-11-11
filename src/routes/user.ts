import { Router } from "express";
import { RowDataPacket } from "mysql2";
import { pool } from "../db";
import { asyncHandler } from "../utils";

const router = Router();

interface ChatRow extends RowDataPacket {
  chatId: number;
  userAId: number;
  userBId: number;
  createdAt: Date;
}

router.get(
  "/:userId/chats",
  asyncHandler(async (req, res) => {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId)) return res.status(400).json({ error: "Invalid userId" });

    const [user] = await pool.query<RowDataPacket[]>("SELECT 1 FROM users WHERE id=?", [userId]);
    if (user.length === 0) return res.status(404).json({ error: "User not found" });

    const [rows] = await pool.query<ChatRow[]>(
      `SELECT id AS "chatId", user_a_id AS "userAId", user_b_id AS "userBId", created_at AS "createdAt"
       FROM chats WHERE user_a_id=? OR user_b_id=? ORDER BY created_at DESC`,
      [userId, userId]
    );
    const chats = rows.map((c) => ({
      chatId: c.chatId,
      memberIds: [c.userAId, c.userBId],
      createdAt: c.createdAt,
    }));
    res.json({ chats });
  })
);

export default router;
