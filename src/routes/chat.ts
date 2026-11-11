import { Router } from "express";
import { z } from "zod";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db";
import { QueryDocumentSnapshot, Timestamp } from "firebase-admin/firestore";
import { firestore, FieldValue } from "../firebase";
import { asyncHandler } from "../utils";

const router = Router();

const id = z.number().int().positive();

async function isMember(chatId: number, userId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT 1 FROM chats WHERE id=? AND (user_a_id=? OR user_b_id=?)",
    [chatId, userId, userId]
  );
  return rows.length > 0;
}

const iso = (t: unknown): string | null => (t instanceof Timestamp ? t.toDate().toISOString() : null);

const messages = (chatId: number) => firestore.collection(`chats/${chatId}/messages`);

router.post(
  "/create",
  asyncHandler(async (req, res) => {
    const p = z.object({ userAId: id, userBId: id }).safeParse(req.body);
    if (!p.success || p.data.userAId === p.data.userBId) {
      return res.status(400).json({ error: "userAId and userBId must be different positive integers" });
    }
    const [a, b] = [p.data.userAId, p.data.userBId].sort((x, y) => x - y);

    const [users] = await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE id IN (?, ?)", [a, b]);
    if (users.length !== 2) return res.status(404).json({ error: "User not found" });

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO chats (user_a_id, user_b_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [a, b]
    );
    res.json({ chatId: result.insertId });
  })
);

router.post(
  "/:chatId/message/send",
  asyncHandler(async (req, res) => {
    const chatId = Number(req.params.chatId);
    const p = z.object({ senderId: id, text: z.string().trim().min(1) }).safeParse(req.body);
    if (!Number.isInteger(chatId) || !p.success) return res.status(400).json({ error: "Invalid input" });
    if (!(await isMember(chatId, p.data.senderId))) return res.status(403).json({ error: "Not a chat member" });

    const ref = await messages(chatId).add({
      senderId: p.data.senderId,
      text: p.data.text,
      createdAt: FieldValue.serverTimestamp(),
      readBy: {},
    });
    res.status(201).json({ messageId: ref.id });
  })
);

router.get(
  "/:chatId/messages",
  asyncHandler(async (req, res) => {
    const chatId = Number(req.params.chatId);
    if (!Number.isInteger(chatId)) return res.status(400).json({ error: "Invalid chatId" });
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

    const [chat] = await pool.query<RowDataPacket[]>("SELECT 1 FROM chats WHERE id=?", [chatId]);
    if (chat.length === 0) return res.status(404).json({ error: "Chat not found" });

    const snap = await messages(chatId).orderBy("createdAt", "desc").limit(limit).get();
    const list = snap.docs
      .map((d: QueryDocumentSnapshot) => {
        const m = d.data();
        const readBy: Record<string, string | null> = {};
        for (const [uid, t] of Object.entries(m.readBy ?? {})) readBy[uid] = iso(t);
        return { id: d.id, senderId: m.senderId, text: m.text, createdAt: iso(m.createdAt), readBy };
      })
      .reverse();
    res.json({ messages: list });
  })
);

router.post(
  "/:chatId/message/:messageId/read",
  asyncHandler(async (req, res) => {
    const chatId = Number(req.params.chatId);
    const p = z.object({ userId: id }).safeParse(req.body);
    if (!Number.isInteger(chatId) || !p.success) return res.status(400).json({ error: "Invalid input" });
    if (!(await isMember(chatId, p.data.userId))) return res.status(403).json({ error: "Not a chat member" });

    const ref = messages(chatId).doc(req.params.messageId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Message not found" });

    await ref.update({ [`readBy.${p.data.userId}`]: FieldValue.serverTimestamp() });
    res.json({ success: true });
  })
);

router.post(
  "/:chatId/lastseen",
  asyncHandler(async (req, res) => {
    const chatId = Number(req.params.chatId);
    const p = z.object({ userId: id, messageId: z.string().min(1) }).safeParse(req.body);
    if (!Number.isInteger(chatId) || !p.success) return res.status(400).json({ error: "Invalid input" });
    if (!(await isMember(chatId, p.data.userId))) return res.status(403).json({ error: "Not a chat member" });

    await firestore.doc(`chats/${chatId}/lastSeen/${p.data.userId}`).set({
      messageId: p.data.messageId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    res.json({ success: true });
  })
);

router.patch(
  "/:chatId/message/:messageId",
  asyncHandler(async (req, res) => {
    const chatId = Number(req.params.chatId);
    const p = z.object({ userId: id, text: z.string().trim().min(1) }).safeParse(req.body);
    if (!Number.isInteger(chatId) || !p.success) return res.status(400).json({ error: "Invalid input" });

    const ref = messages(chatId).doc(req.params.messageId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Message not found" });
    if (doc.get("senderId") !== p.data.userId) return res.status(403).json({ error: "Only sender can edit" });

    await ref.update({ text: p.data.text, editedAt: FieldValue.serverTimestamp() });
    res.json({ success: true });
  })
);

router.delete(
  "/:chatId/message/:messageId",
  asyncHandler(async (req, res) => {
    const chatId = Number(req.params.chatId);
    const p = z.object({ userId: id }).safeParse(req.body);
    if (!Number.isInteger(chatId) || !p.success) return res.status(400).json({ error: "Invalid input" });

    const ref = messages(chatId).doc(req.params.messageId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Message not found" });
    if (doc.get("senderId") !== p.data.userId) return res.status(403).json({ error: "Only sender can delete" });

    await ref.delete();
    res.json({ success: true });
  })
);

export default router;
