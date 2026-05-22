"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import FoodRecommendations from "@/components/FoodRecommendations";
import NutritionAdvice from "@/components/NutritionAdvice";
import NutritionResult from "@/components/NutritionResult";
import PetAnalysisComparison from "@/components/PetAnalysisComparison";
import PetAnalysisHistory from "@/components/PetAnalysisHistory";
import PetProfileCard from "@/components/PetProfileCard";
import PetSummaryStats from "@/components/PetSummaryStats";
import SavedPetsList from "@/components/SavedPetsList";
import SectionCard from "@/components/SectionCard";
import { getCurrentUser } from "@/lib/currentUser";
import { editingPetRepository } from "@/repositories/editingPetRepository";
import { sessionRepository } from "@/repositories/sessionRepository";
import { comparePetAnalyses } from "@/services/petAnalysisComparisonService";
import { petAnalysisHistoryService } from "@/services/petAnalysisHistoryService";
import { buildPetAnalysisHistoryRecord } from "@/services/petAnalysisHistoryBuilder";
import { petAnalysisService } from "@/services/petAnalysisService";
import { petLibraryService } from "@/services/petLibraryService";
import type { PetAnalysisHistory as PetAnalysisHistoryType } from "@/types/pet-analysis-history";
import type { PetNutritionSession } from "@/types/nutrition";
import type { Pet } from "@/types/pet";
import type { PetAnalysis } from "@/types/pet-analysis";

export default function DashboardPage() {
  const router = useRouter();
  const currentUser = getCurrentUser();

  const [session, setSession] = useState<PetNutritionSession | null>(null);
  const [savedPets, setSavedPets] = useState<Pet[]>([]);
  const [analysis, setAnalysis] = useState<PetAnalysis | null>(null);
  const [history, setHistory] = useState<PetAnalysisHistoryType[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  async function loadPetHistory(petId: string) {
    try {
      setHistoryLoading(true);
      const result = await petAnalysisHistoryService.getPetHistory(petId);
      setHistory(result);
    } catch (error) {
      console.error("Failed to load pet history:", error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    async function loadDashboard() {
      try {
        const storedSession = sessionRepository.get();
        const allSavedPets = await petLibraryService.getPetsByOwner(
          currentUser.id
        );

        setSavedPets(allSavedPets);

        if (!storedSession) {
          router.push("/create-pet");
          return;
        }

        setSession(storedSession);

        const analysisResult = await petAnalysisService.analyzePet(
          storedSession.pet
        );
        setAnalysis(analysisResult);

        await loadPetHistory(storedSession.pet.id);

        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
        router.push("/create-pet");
      }
    }

    loadDashboard();
  }, [router, currentUser.id]);

  function handleStartOver() {
    sessionRepository.clear();
    router.push("/create-pet");
  }

  async function handleSelectPet(pet: Pet) {
    try {
      const analysisResult = await petAnalysisService.analyzePet(pet);

      const historyRecord = buildPetAnalysisHistoryRecord(pet, analysisResult);
      await petAnalysisHistoryService.saveAnalysis(historyRecord);

      const newSession: PetNutritionSession = {
        pet: analysisResult.pet,
        nutrition: analysisResult.nutrition,
      };

      sessionRepository.save(newSession);
      setSession(newSession);
      setAnalysis(analysisResult);

      await loadPetHistory(pet.id);
    } catch (error) {
      console.error("Failed to analyze selected pet:", error);
      alert("Failed to load pet analysis.");
    }
  }

  function handleEditCurrentPet() {
    if (!session) return;

    editingPetRepository.save(session.pet);
    router.push("/create-pet");
  }

  async function handleDeletePet(pet: Pet) {
    const shouldDelete = window.confirm(
      `Are you sure you want to delete ${pet.name}'s profile?`
    );

    if (!shouldDelete) return;

    try {
      await petLibraryService.deletePet(pet.id);

      const updatedPets = await petLibraryService.getPetsByOwner(currentUser.id);
      setSavedPets(updatedPets);

      if (session?.pet.id === pet.id) {
        if (updatedPets.length === 0) {
          sessionRepository.clear();
          router.push("/create-pet");
          return;
        }

        const nextPet = updatedPets[0];
        const nextAnalysis = await petAnalysisService.analyzePet(nextPet);

        const newSession: PetNutritionSession = {
          pet: nextAnalysis.pet,
          nutrition: nextAnalysis.nutrition,
        };

        sessionRepository.save(newSession);
        setSession(newSession);
        setAnalysis(nextAnalysis);

        await loadPetHistory(nextPet.id);
      }
    } catch (error) {
      console.error("Failed to delete pet:", error);
      alert("Failed to delete pet profile.");
    }
  }

  if (!isLoaded || !session || !analysis) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-gray-600">Loading dashboard...</p>
      </main>
    );
  }

  const { pet } = session;
  const nutrition = analysis.nutrition;

  const latestComparison =
    history.length >= 2 ? comparePetAnalyses(history[1], history[0]) : null;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <DashboardHeader
        title="Pet Nutrition Dashboard"
        description="Here is your pet’s personalized nutrition overview."
        userName={currentUser.name}
      />

      <PetSummaryStats pet={pet} nutrition={nutrition} />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleEditCurrentPet}
          className="rounded-lg border border-black px-5 py-3 text-black transition hover:bg-gray-100"
        >
          Edit Current Pet
        </button>

        <button
          type="button"
          onClick={handleStartOver}
          className="rounded-lg bg-black px-5 py-3 text-white transition hover:opacity-90"
        >
          Create New Pet Profile
        </button>
        <a
          href="/print/pet-report"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-black px-5 py-3 text-black transition hover:bg-gray-100"
        >
        Print Report
        </a>
      </div>

      <SectionCard
        title="Pet Profile Details"
        description="Basic information about the active pet profile."
      >
        <PetProfileCard pet={pet} />
      </SectionCard>

      <SavedPetsList
        pets={savedPets}
        activePetId={pet.id}
        onSelect={handleSelectPet}
        onDelete={handleDeletePet}
      />

      <SectionCard
        title="Nutrition Analysis"
        description="Estimated nutritional guidance based on the current pet profile."
      >
        <NutritionResult result={nutrition} />
      </SectionCard>

      <SectionCard
        title="Analysis History"
        description="Previously saved nutrition analyses for this pet."
      >
        <PetAnalysisHistory history={history} loading={historyLoading} />
      </SectionCard>

      {latestComparison && (
        <PetAnalysisComparison comparison={latestComparison} />
      )}

      <SectionCard
        title="AI Nutrition Advice"
        description="Guidance generated from the current profile, activity, and health data."
      >
        <NutritionAdvice advice={analysis.advice} />
      </SectionCard>

      <SectionCard
        title="Recommended Foods"
        description="Foods ranked by profile fit, nutritional support, and practical matching."
      >
        <FoodRecommendations foods={analysis.recommendedFoods} />
      </SectionCard>
    </main>
  );
}