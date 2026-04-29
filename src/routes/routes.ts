import { Router } from "express";
import * as zoneApi from "./zone.api";
import * as collectionApi from "./collection.api";
import * as storeApi from "./store.api";
import * as slotApi from "./slot.api";
import * as userApi from "./user.api";
import * as assignmentApi from "./assignment.api";
import * as userAnswerApi from "./userAnswer.api";
import * as authApi from "./auth.api";
import * as notificationApi from "./notification.api";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { apiKeyMiddleware } from "../middlewares/apiKey.middleware";

const router = Router();

// ─── Auth Routes (public) ────────────────────────────────────────────────────
router.post("/auth/login", authApi.login);
router.post("/auth/logout", authApi.logout);
router.post("/user-answers", userAnswerApi.createUserAnswer);
router.put("/user-answers/:id", userAnswerApi.updateUserAnswer);

// form
router.get("/collections/:id", collectionApi.getCollectionById);

// ────────────────────────────────────────────────────────────────────────────
// All routes below require authentication
// ────────────────────────────────────────────────────────────────────────────
router.use(authMiddleware);
router.use(apiKeyMiddleware);

// ─── Zone Routes ─────────────────────────────────────────────────────────────
router.post("/zones", zoneApi.createZone);
router.put("/zones/:id", zoneApi.updateZone);
router.delete("/zones/:id", zoneApi.deleteZone);
router.get("/zones/:id", zoneApi.getZoneById);
router.get("/zones", zoneApi.getAllZones);

// ─── Collection Routes ────────────────────────────────────────────────────────
router.post("/collections", collectionApi.createCollection);
router.put("/collections/:id", collectionApi.updateCollection);
router.get("/collectionsBoard/:id", collectionApi.getCollectionBoardById);
router.get("/collections/:id/users", collectionApi.getUsersExcelByCollectionId);
router.get("/collections", collectionApi.getAllCollections);
router.post(
  "/collections/:id/notifications",
  notificationApi.sendNotifications,
);

// ─── Store Routes ────────────────────────────────────────────────────────────
router.post("/stores", storeApi.createStore);
router.put("/stores/:id", storeApi.updateStore);
router.delete("/stores/:id", storeApi.deleteStore);
router.get("/stores/:id", storeApi.getStoreById);
router.get("/stores", storeApi.getAllStores);

// ─── Slot Routes ─────────────────────────────────────────────────────────────
router.post("/slots", slotApi.createSlot);
router.put("/slots/:id", slotApi.updateSlot);
router.delete("/slots/:id", slotApi.deleteSlot);
router.get("/slots/:id", slotApi.getSlotById);
router.get("/slots", slotApi.getAllSlots);

// ─── User Routes ─────────────────────────────────────────────────────────────
router.post("/users", userApi.createUser);
router.put("/users/:id", userApi.updateUser);
router.delete("/users/:id", userApi.deleteUser);
router.get("/users/admins", userApi.getAdmins);
router.get("/users/:id", userApi.getUserById);
router.get("/users", userApi.getAllUsers);

// ─── UserAnswer Routes ───────────────────────────────────────────────────────
router.delete("/user-answers/:id", userAnswerApi.deleteUserAnswer);
router.get("/user-answers/:id", userAnswerApi.getUserAnswerById);
router.get(
  "/collections/:collectionId/user-answers",
  userAnswerApi.getUserAnswerByCollectionId,
);

// ─── Assignment Routes ───────────────────────────────────────────────────────
router.post("/assignments", assignmentApi.createAssignment);
router.put("/assignments", assignmentApi.updateAssignment);
router.delete("/assignments", assignmentApi.deleteAssignment);
router.get(
  "/collections/:collectionId/assignments",
  assignmentApi.getAssignmentsByCollectionId,
);

export default router;
