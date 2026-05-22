import type { Pet } from "@/types/pet";

type SavedPetsListProps = {
  pets: Pet[];
  activePetId?: string;
  onSelect: (pet: Pet) => void;
  onDelete: (pet: Pet) => void;
};

export default function SavedPetsList({
  pets,
  activePetId,
  onSelect,
  onDelete,
}: SavedPetsListProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-black">
        Saved Pet Profiles
      </h2>

      {pets.length === 0 ? (
        <p className="text-sm text-black">No saved pet profiles yet.</p>
      ) : (
        <div className="space-y-3">
          {pets.map((pet) => {
            const isActive = pet.id === activePetId;

            return (
              <div
                key={pet.id}
                className={`rounded-xl border p-4 ${
                  isActive
                    ? "border-black bg-gray-100"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-black">
                      {pet.name} {isActive ? "• Active" : ""}
                    </p>
                    <p className="text-sm text-black">
                      {pet.species} • {pet.breed} • {pet.age} years
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onSelect(pet)}
                      className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-200"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(pet)}
                      className="rounded-lg border border-red-600 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}