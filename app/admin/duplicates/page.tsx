"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type DuplicateRecord = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

type DuplicateGroup = {
  type: "food" | "pet";
  key: string;
  count: number;
  records: DuplicateRecord[];
};

type DuplicateResponse = {
  totalGroups: number;
  groups: DuplicateGroup[];
};

type ReviewState = {
  status: string;
  notes: string;
  chosenRecordId: string;
};

type MergePreviewState = {
  groupKey: string;
  groupType: "food" | "pet";
  chosenRecordId: string;
  survivorTitle: string;
  recordsToDelete: DuplicateRecord[];
};

type SavedDuplicateReview = {
  id: string;
  duplicate_key: string;
  duplicate_type: string;
  status: string;
  notes: string | null;
  chosen_record_id: string | null;
  created_at: string;
  updated_at: string;
};

function getReviewKey(group: DuplicateGroup) {
  return `${group.type}::${group.key}`;
}

function getReviewKeyFromSavedReview(review: SavedDuplicateReview) {
  return `${review.duplicate_type}::${review.duplicate_key}`;
}

export default function AdminDuplicatesPage() {
  const [data, setData] = useState<DuplicateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [mergingKey, setMergingKey] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({});
  const [mergePreview, setMergePreview] = useState<MergePreviewState | null>(
    null
  );

  const loadDuplicates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const [groupsResponse, reviewsResponse] = await Promise.all([
        fetch("/api/admin/duplicates", {
          method: "GET",
          cache: "no-store",
        }),
        fetch("/api/admin/duplicate-review/list", {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      const groupsResult = await groupsResponse.json();
      const reviewsResult = await reviewsResponse.json();

      if (!groupsResponse.ok) {
        throw new Error(groupsResult.error || "Failed to load duplicate groups.");
      }

      if (!reviewsResponse.ok) {
        throw new Error(
          reviewsResult.error || "Failed to load duplicate reviews."
        );
      }

      const duplicateData = groupsResult as DuplicateResponse;
      const savedReviews = reviewsResult as SavedDuplicateReview[];

      const nextReviews: Record<string, ReviewState> = {};

      for (const review of savedReviews) {
        const key = getReviewKeyFromSavedReview(review);
        nextReviews[key] = {
          status: review.status ?? "open",
          notes: review.notes ?? "",
          chosenRecordId: review.chosen_record_id ?? "",
        };
      }

      setData(duplicateData);
      setReviews(nextReviews);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to load duplicate groups."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDuplicates();
  }, [loadDuplicates]);

  function updateReview(group: DuplicateGroup, patch: Partial<ReviewState>) {
    const key = getReviewKey(group);

    setReviews((prev) => ({
      ...prev,
      [key]: {
        status: prev[key]?.status ?? "open",
        notes: prev[key]?.notes ?? "",
        chosenRecordId: prev[key]?.chosenRecordId ?? "",
        ...patch,
      },
    }));
  }

  async function saveReview(group: DuplicateGroup) {
    const key = getReviewKey(group);
    const review = reviews[key] ?? {
      status: "open",
      notes: "",
      chosenRecordId: "",
    };

    try {
      setSavingKey(key);
      setError("");
      setFeedbackMessage("");

      const response = await fetch("/api/admin/duplicate-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          duplicateKey: group.key,
          duplicateType: group.type,
          status: review.status,
          notes: review.notes,
          chosenRecordId: review.chosenRecordId || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save review.");
      }

      setFeedbackMessage("Duplicate review saved.");
      await loadDuplicates();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save review.");
    } finally {
      setSavingKey("");
    }
  }

  function openMergePreview(group: DuplicateGroup) {
    const key = getReviewKey(group);
    const review = reviews[key] ?? {
      status: "open",
      notes: "",
      chosenRecordId: "",
    };

    if (!review.chosenRecordId) {
      setError("Please choose which record should survive before merging.");
      setFeedbackMessage("");
      return;
    }

    const survivor = group.records.find(
      (record) => record.id === review.chosenRecordId
    );

    if (!survivor) {
      setError("The selected survivor record was not found in this group.");
      setFeedbackMessage("");
      return;
    }

    const recordsToDelete = group.records.filter(
      (record) => record.id !== review.chosenRecordId
    );

    setMergePreview({
      groupKey: group.key,
      groupType: group.type,
      chosenRecordId: review.chosenRecordId,
      survivorTitle: survivor.title,
      recordsToDelete,
    });
  }

  async function confirmMerge() {
    if (!mergePreview || !data) return;

    const group = data.groups.find(
      (item) =>
        item.key === mergePreview.groupKey &&
        item.type === mergePreview.groupType
    );

    if (!group) {
      setError("Duplicate group could not be found.");
      setFeedbackMessage("");
      return;
    }

    const reviewKey = getReviewKey(group);

    try {
      setMergingKey(reviewKey);
      setError("");
      setFeedbackMessage("");

      const response = await fetch("/api/admin/duplicates/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          duplicateType: group.type,
          duplicateKey: group.key,
          chosenRecordId: mergePreview.chosenRecordId,
          recordIds: group.records.map((record) => record.id),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to merge duplicate group.");
      }

      setMergePreview(null);
      setFeedbackMessage("Duplicate group merged successfully.");
      await loadDuplicates();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to merge duplicate group."
      );
    } finally {
      setMergingKey("");
    }
  }

  const previewDeleteCount = useMemo(
    () => mergePreview?.recordsToDelete.length ?? 0,
    [mergePreview]
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Duplicate Review</h2>
          <p className="mt-2 text-gray-600">
            Review groups of pets or foods that may be duplicate records.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDuplicates}
          className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
        >
          Refresh Duplicate Check
        </button>
      </div>

      {mergePreview && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-black">Merge Preview</h3>
              <p className="mt-2 text-sm text-gray-700">
                You are about to merge a duplicate {mergePreview.groupType} group.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMergePreview(null)}
              className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-white"
            >
              Cancel Preview
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-black">Record to keep</p>
              <p className="mt-2 font-semibold text-black">
                {mergePreview.survivorTitle}
              </p>
              <p className="mt-1 text-sm text-gray-700">
                ID: {mergePreview.chosenRecordId}
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-white p-4">
              <p className="text-sm font-medium text-black">Records to delete</p>
              <p className="mt-2 font-semibold text-black">
                {previewDeleteCount} record(s)
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {mergePreview.recordsToDelete.map((record) => (
              <div
                key={record.id}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <p className="font-semibold text-black">{record.title}</p>
                <p className="mt-1 text-sm text-gray-600">{record.subtitle}</p>
                <p className="mt-1 text-xs text-gray-500">ID: {record.id}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={confirmMerge}
              disabled={
                !!mergingKey &&
                data?.groups.some((group) => getReviewKey(group) === mergingKey)
              }
              className="rounded-lg bg-red-600 px-5 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
            >
              Confirm Merge
            </button>

            <button
              type="button"
              onClick={() => setMergePreview(null)}
              className="rounded-lg border border-black px-5 py-3 text-black transition hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {feedbackMessage && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {feedbackMessage}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-600">Checking duplicates...</p>
        ) : !data || data.groups.length === 0 ? (
          <p className="text-sm text-gray-600">No duplicate groups found.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-600">
              Found {data.totalGroups} duplicate group(s).
            </p>

            <div className="space-y-4">
              {data.groups.map((group, index) => {
                const reviewKey = getReviewKey(group);
                const review = reviews[reviewKey] ?? {
                  status: "open",
                  notes: "",
                  chosenRecordId: "",
                };

                return (
                  <div
                    key={`${group.type}-${group.key}-${index}`}
                    className="rounded-xl border border-yellow-200 bg-yellow-50 p-4"
                  >
                    <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold text-black">
                          {group.type === "food" ? "Food duplicates" : "Pet duplicates"}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          {group.count} similar records
                        </p>
                      </div>

                      <div className="text-sm">
                        <span className="rounded-full border border-gray-300 bg-white px-3 py-1 text-gray-700">
                          Status: {review.status || "open"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {group.records.map((record) => {
                        const isChosen = review.chosenRecordId === record.id;

                        return (
                          <div
                            key={record.id}
                            className={`rounded-xl border p-4 ${
                              isChosen
                                ? "border-green-300 bg-green-50"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <div>
                                <p className="font-semibold text-black">
                                  {record.title}
                                  {isChosen ? " / chosen survivor" : ""}
                                </p>
                                <p className="mt-1 text-sm text-gray-600">
                                  {record.subtitle}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  ID: {record.id}
                                </p>
                              </div>

                              <a
                                href={record.href}
                                className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
                              >
                                Open Record
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-black">
                          Review Status
                        </label>
                        <select
                          value={review.status}
                          onChange={(e) =>
                            updateReview(group, { status: e.target.value })
                          }
                          className="w-full rounded-lg border border-gray-300 p-3 text-black"
                        >
                          <option value="open">Open</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="false-positive">False Positive</option>
                          <option value="merge-later">Merge Later</option>
                          <option value="merged">Merged</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-black">
                          Chosen Record
                        </label>
                        <select
                          value={review.chosenRecordId}
                          onChange={(e) =>
                            updateReview(group, { chosenRecordId: e.target.value })
                          }
                          className="w-full rounded-lg border border-gray-300 p-3 text-black"
                        >
                          <option value="">None selected</option>
                          {group.records.map((record) => (
                            <option key={record.id} value={record.id}>
                              {record.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <label className="mb-2 block text-sm font-medium text-black">
                          Notes
                        </label>
                        <textarea
                          value={review.notes}
                          onChange={(e) =>
                            updateReview(group, { notes: e.target.value })
                          }
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 p-3 text-black"
                          placeholder="Write notes about how this duplicate group should be handled..."
                        />
                      </div>

                      <div className="md:col-span-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => saveReview(group)}
                          disabled={savingKey === reviewKey}
                          className="rounded-lg bg-black px-5 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
                        >
                          {savingKey === reviewKey ? "Saving..." : "Save Review"}
                        </button>

                        {group.records.length > 1 && (
                          <button
                            type="button"
                            onClick={() => openMergePreview(group)}
                            disabled={mergingKey === reviewKey}
                            className="rounded-lg border border-red-600 px-5 py-3 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            Preview Merge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
