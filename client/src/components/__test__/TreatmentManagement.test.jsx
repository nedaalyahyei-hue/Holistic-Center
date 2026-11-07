
import { test, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import TreatmentManagement from "../admin/TreatmentManagement";

// Mock MessageNotification
vi.mock("../admin/MessageNotification", () => ({
  default: () => null,
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

// Functionality 1: Add Treatment - Automated Testing
test("Add Treatment - should add a new treatment", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url, options) => {
      if (options?.method === "POST") {
        return Promise.resolve({
          json: async () => ({
            message: "success",
            treatment: {
              _id: "1",
              name: "Massage",
            },
          }),
        });
      }

      return Promise.resolve({
        json: async () => ({
          message: "success",
          treatments: [],
        }),
      });
    })
  );

  render(
    <MemoryRouter>
      <TreatmentManagement />
    </MemoryRouter>
  );

  // Wait until treatments are loaded
  await screen.findByText("No treatments added yet.");

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3002/admin/treatments"
    );
  });

  // Enter treatment name
  fireEvent.change(
    screen.getByPlaceholderText("Enter treatment name"),
    { target: { value: "Massage" } }
  );

  // Click Add Treatment
  fireEvent.click(
    screen.getByRole("button", { name: "Add Treatment" })
  );

  // Check POST request
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3002/admin/treatments",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Massage" }),
      })
    );
  });

  // Check treatment appears
  expect(
    await screen.findByText("Massage")
  ).toBeInTheDocument();
});

// Functionality 2: Edit Treatment - Automated Testing
test("Edit Treatment - should update a treatment", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url, options) => {
      if (options?.method === "PUT") {
        return Promise.resolve({
          json: async () => ({
            message: "success",
            treatment: {
              _id: "1",
              name: "Updated Massage",
            },
          }),
        });
      }

      return Promise.resolve({
        json: async () => ({
          message: "success",
          treatments: [
            {
              _id: "1",
              name: "Massage",
            },
          ],
        }),
      });
    })
  );

  render(
    <MemoryRouter>
      <TreatmentManagement />
    </MemoryRouter>
  );

  // Wait for existing treatment
  expect(
    await screen.findByText("Massage")
  ).toBeInTheDocument();

  // Click Edit
  fireEvent.click(
    screen.getByRole("button", { name: "Edit" })
  );

  // Change treatment name
  fireEvent.change(
    screen.getByPlaceholderText("Enter treatment name"),
    { target: { value: "Updated Massage" } }
  );

  // Click Save Changes
  fireEvent.click(
    screen.getByRole("button", { name: "Save Changes" })
  );

  // Check PUT request
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3002/admin/treatments/1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ name: "Updated Massage" }),
      })
    );
  });

  // Check updated treatment appears
  expect(
    await screen.findByText("Updated Massage")
  ).toBeInTheDocument();
});
