import type { Pet } from "@/types/pet";

type PetProfileCardProps = {
  pet: Pet;
};

export default function PetProfileCard({ pet }: PetProfileCardProps) {
  return (
    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
      <p className="text-black">
        <span className="font-semibold">Name:</span> {pet.name}
      </p>
      <p className="text-black">
        <span className="font-semibold">Species:</span> {pet.species}
      </p>
      <p className="text-black">
        <span className="font-semibold">Breed:</span> {pet.breed}
      </p>
      <p className="text-black">
        <span className="font-semibold">Age:</span> {pet.age}
      </p>
      <p className="text-black">
        <span className="font-semibold">Weight:</span> {pet.weight} kg
      </p>
      <p className="text-black">
        <span className="font-semibold">Activity Level:</span> {pet.activityLevel}
      </p>
      <p className="text-black">
        <span className="font-semibold">Neutered:</span>{" "}
        {pet.neutered ? "Yes" : "No"}
      </p>
      <p className="text-black">
        <span className="font-semibold">Allergies:</span>{" "}
        {pet.allergies && pet.allergies.length > 0
          ? pet.allergies.join(", ")
          : "None"}
      </p>
      <p className="text-black md:col-span-2">
        <span className="font-semibold">Health Issues:</span>{" "}
        {pet.healthIssues && pet.healthIssues.length > 0
          ? pet.healthIssues.join(", ")
          : "None"}
      </p>
    </div>
  );
}