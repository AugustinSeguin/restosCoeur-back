import { Router } from "express";
import * as zoneApi from "./zone.api";
import * as collectionApi from "./collection.api";
import * as storeApi from "./store.api";
import * as storeSlotApi from "./storeSlot.api";
import * as userApi from "./user.api";
import * as assignmentApi from "./assignment.api";
import * as userAnswerApi from "./userAnswer.api";
import * as authApi from "./auth.api";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router = Router();

// ─── Auth Routes (public) ────────────────────────────────────────────────────
router.post("/auth/login", authApi.login);
router.post("/auth/logout", authApi.logout);
router.post("/user-answers", userAnswerApi.createUserAnswer);
router.put("/user-answers/:id", userAnswerApi.updateUserAnswer);

// ────────────────────────────────────────────────────────────────────────────
// All routes below require authentication
// ────────────────────────────────────────────────────────────────────────────
router.use(authMiddleware);

// ─── Zone Routes ─────────────────────────────────────────────────────────────
router.post("/zones", zoneApi.createZone);
router.put("/zones/:id", zoneApi.updateZone);
router.delete("/zones/:id", zoneApi.deleteZone);
router.get("/zones/:id", zoneApi.getZoneById);
router.get("/zones", zoneApi.getAllZones);

// ─── Collection Routes ────────────────────────────────────────────────────────
router.post("/collections", collectionApi.createCollection);
router.put("/collections/:id", collectionApi.updateCollection);
router.get("/collections/:id", collectionApi.getCollectionById);
router.get("/collections", collectionApi.getAllCollections);

// ─── Store Routes ────────────────────────────────────────────────────────────
router.post("/stores", storeApi.createStore);
router.put("/stores/:id", storeApi.updateStore);
router.delete("/stores/:id", storeApi.deleteStore);
router.get("/stores/:id", storeApi.getStoreById);
router.get("/stores", storeApi.getAllStores);

// ─── StoreSlot Routes ────────────────────────────────────────────────────────
router.post("/slots", storeSlotApi.createStoreSlot);
router.put("/slots/:id", storeSlotApi.updateStoreSlot);
router.delete("/slots/:id", storeSlotApi.deleteStoreSlot);
router.get("/slots/:id", storeSlotApi.getStoreSlotById);
router.get("/slots", storeSlotApi.getAllStoreSlots);

// ─── User Routes ─────────────────────────────────────────────────────────────
router.post("/users", userApi.createUser);
router.put("/users/:id", userApi.updateUser);
router.delete("/users/:id", userApi.deleteUser);
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
router.put("/assignments/:userId/:storeSlotId", assignmentApi.updateAssignment);
router.delete(
  "/assignments/:userId/:storeSlotId",
  assignmentApi.deleteAssignment,
);
router.get(
  "/collections/:collectionId/assignments",
  assignmentApi.getAssignmentsByCollectionId,
);

export default router;
