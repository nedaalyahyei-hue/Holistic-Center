import { describe, it, after } from "node:test";
import assert from "node:assert/strict";

const BASE = "http://localhost:3002";

// Test center (registered once, then reused)
const CENTER = {
  username: "Test Center",
  email: "center@test.com",
  phone: "99999999",
  password: "Test@1234",
};

const api = async (method, path, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
};

let centerId;
let treatmentId;

describe("Center - Auth", () => {
  it("register-center: registers a center or says it already exists", async () => {
    const r = await api("POST", "/register-center", CENTER);
    assert.ok(["Center Registered", "Center Exists"].includes(r.message), r.message);
  });

  it("login: succeeds with the center account", async () => {
    const r = await api("POST", "/login", {
      email: CENTER.email,
      password: CENTER.password,
    });
    assert.equal(r.message, "success");

    
    assert.equal(r.user.role, "center");
    centerId = r.user._id;
    assert.ok(centerId);
  });

  it("login: rejects a wrong password", async () => {
    const r = await api("POST", "/login", {
      email: CENTER.email,
      password: "wrong-password",
    });
    assert.notEqual(r.message, "success");
  });

  it("login: rejects an email that does not exist", async () => {
    const r = await api("POST", "/login", {
      email: "nobody@nowhere.com",
      password: "x",
    });
    assert.equal(r.message, "Invalid Email");
  });
});

describe("Center - Profile", () => {
  it("GET /center/:id: returns center data without the password", async () => {
    const r = await api("GET", `/center/${centerId}`);
    assert.equal(r.message, "success");
    assert.equal(r.center.email, CENTER.email);
    assert.equal(r.center.password, undefined);
  });

  it("GET /center/:id: returns not found for an unknown id", async () => {
    const r = await api("GET", "/center/000000000000000000000000");
    assert.equal(r.message, "Center not found");
  });

  it("PUT /center/:id: updates phone, image, location and description", async () => {
    const r = await api("PUT", `/center/${centerId}`, {
      phone: "91111111",
      image: "https://picsum.photos/id/1011/400/400",
      location: "Muscat, Al Seeb",
      description: "Test description",
    });
    assert.equal(r.message, "success");

    const check = await api("GET", `/center/${centerId}`);
    assert.equal(check.center.phone, "91111111");
    assert.equal(check.center.location, "Muscat, Al Seeb");
    assert.equal(check.center.description, "Test description");
  });

  it("PUT /center/:id: username and email cannot be changed", async () => {
    await api("PUT", `/center/${centerId}`, {
      username: "Hacked",
      email: "hacked@test.com",
      phone: "91111111",
    });
    const check = await api("GET", `/center/${centerId}`);
    assert.equal(check.center.username, CENTER.username);
    assert.equal(check.center.email, CENTER.email);
  });
});

describe("Center - Treatments", () => {
  it("POST /treatments: adds a treatment", async () => {
    const r = await api("POST", "/treatments", {
      name: "TEST Hijama",
      price: 15,
      duration: 30,
      category: "Hijama",
      location: "Muscat",
      description: "test",
      centerId,
    });
    assert.equal(r.message, "success");
    treatmentId = r.treatment._id;
    assert.ok(treatmentId);
  });

  it("POST /treatments: rejects a treatment without a name", async () => {
    const r = await api("POST", "/treatments", {
      price: 10,
      duration: 20,
      centerId,
    });
    assert.notEqual(r.message, "success");
  });

  it("GET /treatments/center/:id: treatment appears in the center list", async () => {
    const r = await api("GET", `/treatments/center/${centerId}`);
    assert.equal(r.message, "success");
    assert.ok(r.treatments.some((t) => t._id === treatmentId));
  });

  it("GET /treatments/:id: returns a single treatment", async () => {
    const r = await api("GET", `/treatments/${treatmentId}`);
    assert.equal(r.message, "success");
    assert.equal(r.treatment.name, "TEST Hijama");
  });

  it("PUT /treatments/:id: updates the price", async () => {
    const r = await api("PUT", `/treatments/${treatmentId}`, { price: 20 });
    assert.equal(r.message, "success");
    assert.equal(r.treatment.price, 20);
  });

  it("DELETE /treatments/:id: deletes the treatment", async () => {
    const r = await api("DELETE", `/treatments/${treatmentId}`);
    assert.equal(r.message, "success");

    const check = await api("GET", `/treatments/${treatmentId}`);
    assert.equal(check.message, "Treatment not found");
    treatmentId = null;
  });
});

// Cleanup: if a test fails before the delete, remove the test treatment
after(async () => {
  if (treatmentId) await api("DELETE", `/treatments/${treatmentId}`);
});