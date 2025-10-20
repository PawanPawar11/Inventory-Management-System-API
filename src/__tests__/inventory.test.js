import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../server.js";
import inventoryModel from "../models/crud.model.js";
import dotenv from "dotenv";

dotenv.config();

describe("Inventory Management", () => {
  let productId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await inventoryModel.deleteMany({});

    const product = await inventoryModel.create({
      name: "TestProd",
      description: "A test product",
      stock_quantity: 100,
      low_stock_threshold: 20,
    });
    productId = product._id;
  });

  afterEach(async () => {
    await inventoryModel.deleteMany({});
  });

  describe("Stock Addition", () => {
    it("should successfully increase stock by positive quantity", async () => {
      const res = await request(app)
        .put(`/api/products/increase/${productId}`)
        .send({ quantity: 50 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stock_quantity).toBe(150);
      expect(res.body.message).toContain("Stock increased by 50");
    });

    it("should increase stock from zero", async () => {
      const product = await inventoryModel.create({
        name: "Empty",
        description: "Starting with zero",
        stock_quantity: 0,
      });

      const res = await request(app)
        .put(`/api/products/increase/${product._id}`)
        .send({ quantity: 25 });

      expect(res.status).toBe(200);
      expect(res.body.data.stock_quantity).toBe(25);
    });

    it("should handle large quantity additions", async () => {
      const res = await request(app)
        .put(`/api/products/increase/${productId}`)
        .send({ quantity: 10000 });

      expect(res.status).toBe(200);
      expect(res.body.data.stock_quantity).toBe(10100);
    });

    it("should reject zero quantity", async () => {
      const res = await request(app)
        .put(`/api/products/increase/${productId}`)
        .send({ quantity: 0 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Quantity must be a positive number");
    });

    it("should reject negative quantity", async () => {
      const res = await request(app)
        .put(`/api/products/increase/${productId}`)
        .send({ quantity: -10 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject missing quantity", async () => {
      const res = await request(app)
        .put(`/api/products/increase/${productId}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 404 for non-existent product", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/products/increase/${fakeId}`)
        .send({ quantity: 10 });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("not found");
    });
  });

  describe("Stock Removal", () => {
    it("should successfully decrease stock by valid quantity", async () => {
      const res = await request(app)
        .put(`/api/products/decrease/${productId}`)
        .send({ quantity: 30 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stock_quantity).toBe(70);
      expect(res.body.message).toContain("Stock decreased by 30");
    });

    it("should successfully decrease stock to zero", async () => {
      const res = await request(app)
        .put(`/api/products/decrease/${productId}`)
        .send({ quantity: 100 });

      expect(res.status).toBe(200);
      expect(res.body.data.stock_quantity).toBe(0);
    });

    it("should reject removal of more stock than available", async () => {
      const res = await request(app)
        .put(`/api/products/decrease/${productId}`)
        .send({ quantity: 150 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Insufficient stock");
      expect(res.body.message).toContain("Available: 100");
    });

    it("should reject removal from product with no stock", async () => {
      const product = await inventoryModel.create({
        name: "Empty",
        description: "No stock",
        stock_quantity: 0,
      });

      const res = await request(app)
        .put(`/api/products/decrease/${product._id}`)
        .send({ quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Insufficient stock");
    });

    it("should reject zero quantity", async () => {
      const res = await request(app)
        .put(`/api/products/decrease/${productId}`)
        .send({ quantity: 0 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject negative quantity", async () => {
      const res = await request(app)
        .put(`/api/products/decrease/${productId}`)
        .send({ quantity: -5 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject missing quantity", async () => {
      const res = await request(app)
        .put(`/api/products/decrease/${productId}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 404 for non-existent product", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/products/decrease/${fakeId}`)
        .send({ quantity: 10 });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("not found");
    });

    it("should handle concurrent stock operations safely", async () => {
      const res1 = await request(app)
        .put(`/api/products/decrease/${productId}`)
        .send({ quantity: 60 });

      const res2 = await request(app)
        .put(`/api/products/decrease/${productId}`)
        .send({ quantity: 40 });

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.data.stock_quantity).toBe(40);
      expect(res2.body.data.stock_quantity).toBe(0);
    });
  });

  describe("Low Stock Threshold", () => {
    it("should list products below threshold", async () => {
      await inventoryModel.create({
        name: "LowItem",
        description: "Below threshold",
        stock_quantity: 5,
        low_stock_threshold: 10,
      });

      const res = await request(app).get("/api/products/low-stock-threshold");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
      expect(res.body.data.some((p) => p.name === "LowItem")).toBe(true);
    });

    it("should not list products at or above threshold", async () => {
      await inventoryModel.deleteMany({});

      await inventoryModel.create({
        name: "Normal",
        description: "Above threshold",
        stock_quantity: 100,
        low_stock_threshold: 20,
      });

      const res = await request(app).get("/api/products/low-stock-threshold");

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
    });

    it("should return empty list when no products are low", async () => {
      await inventoryModel.deleteMany({});

      const res = await request(app).get("/api/products/low-stock-threshold");

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe("CRUD Operations", () => {
    it("should create a new product", async () => {
      const res = await request(app).post("/api/products/create").send({
        name: "NewProd",
        description: "A brand new product",
        stock_quantity: 50,
        low_stock_threshold: 5,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("NewProd");
      expect(res.body.data.stock_quantity).toBe(50);
    });

    it("should read all products", async () => {
      const res = await request(app).get("/api/products/read-all-products");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should read a single product", async () => {
      const res = await request(app).get(
        `/api/products/read-one-product/${productId}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(productId.toString());
      expect(res.body.data.name).toBe("TestProd");
    });

    it("should update a product", async () => {
      const res = await request(app)
        .put(`/api/products/update/${productId}`)
        .send({
          name: "Updated",
          description: "Updated description",
          stock_quantity: 75,
          low_stock_threshold: 15,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Updated");
      expect(res.body.data.stock_quantity).toBe(75);
    });

    it("should delete a product", async () => {
      const res = await request(app).delete(
        `/api/products/delete/${productId}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("deleted successfully");

      const checkRes = await request(app).get(
        `/api/products/read-one-product/${productId}`
      );
      expect(checkRes.status).toBe(404);
    });

    it("should reject creating product without required fields", async () => {
      const res = await request(app)
        .post("/api/products/create")
        .send({ name: "OnlyName" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("required");
    });

    it("should reject creating product with negative stock", async () => {
      const res = await request(app).post("/api/products/create").send({
        name: "BadProd",
        description: "Negative stock",
        stock_quantity: -5,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 404 for non-existent product on read", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(
        `/api/products/read-one-product/${fakeId}`
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("not found");
    });
  });
});
