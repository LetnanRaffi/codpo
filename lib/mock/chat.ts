import type { Conversation, Message } from "@/lib/types";

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "cnv-001",
    listing_id: "lst-001",
    participant_id: "sel-01",
    last_message: "Boleh, jam 3 oke. Ketemu depan McDonald's ya",
    unread_count: 1,
    updated_at: "2026-08-21T19:42:00+07:00",
  },
  {
    id: "cnv-002",
    listing_id: "lst-006",
    participant_id: "sel-06",
    last_message: "Mejanya masih ada kak, COD bisa malem?",
    unread_count: 0,
    updated_at: "2026-08-21T14:10:00+07:00",
  },
  {
    id: "cnv-003",
    listing_id: "lst-002",
    participant_id: "sel-02",
    last_message: "Oke gue cek dulu ban nya",
    unread_count: 0,
    updated_at: "2026-08-20T09:05:00+07:00",
  },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  "cnv-001": [
    {
      id: "msg-001",
      sender_id: "usr-test",
      type: "text",
      body: "Bro iPhone 13 masih ready? Baterai beneran 89%?",
      created_at: "2026-08-21T18:55:00+07:00",
    },
    {
      id: "msg-002",
      sender_id: "sel-01",
      type: "text",
      body: "Ready bro, baru check di service center minggu lalu. Nih ss battery healthnya",
      created_at: "2026-08-21T19:01:00+07:00",
    },
    {
      id: "msg-003",
      sender_id: "sel-01",
      type: "image",
      image_url: null,
      body: "screenshot-battery.png",
      created_at: "2026-08-21T19:02:00+07:00",
    },
    {
      id: "msg-004",
      sender_id: "usr-test",
      type: "cod_action",
      body: "Mengajukan COD — Besok 15:00 · Alun-alun Bekasi",
      cod_status: "requested",
      created_at: "2026-08-21T19:30:00+07:00",
    },
    {
      id: "msg-005",
      sender_id: "sel-01",
      type: "text",
      body: "Boleh, jam 3 oke. Ketemu depan McDonald's ya",
      created_at: "2026-08-21T19:42:00+07:00",
    },
  ],
  "cnv-002": [
    {
      id: "msg-101",
      sender_id: "usr-test",
      type: "text",
      body: "Mbak meja belajarnya masih ada?",
      created_at: "2026-08-21T13:50:00+07:00",
    },
    {
      id: "msg-102",
      sender_id: "sel-06",
      type: "text",
      body: "Mejanya masih ada kak, COD bisa malem?",
      created_at: "2026-08-21T14:10:00+07:00",
    },
  ],
  "cnv-003": [
    {
      id: "msg-201",
      sender_id: "usr-test",
      type: "text",
      body: "Sepeda udah perlu tune-up apa langsung pakai?",
      created_at: "2026-08-20T08:40:00+07:00",
    },
    {
      id: "msg-202",
      sender_id: "sel-02",
      type: "text",
      body: "Baru tune-up bulan lalu, langsung pakai aja. Ban belakang mau gue ganti dulu sih",
      created_at: "2026-08-20T08:58:00+07:00",
    },
    {
      id: "msg-203",
      sender_id: "sel-02",
      type: "text",
      body: "Oke gue cek dulu ban nya",
      created_at: "2026-08-20T09:05:00+07:00",
    },
  ],
};
