"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface Question {
  id: string;
  text: string;
}

export interface Competency {
  id: string;
  name: string;
  description?: string;
  questions: Question[];
}

interface CompetencyEditorProps {
  competency: Competency;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (competency: Competency) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function CompetencyEditor({
  competency,
  index,
  isExpanded,
  onToggle,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: CompetencyEditorProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(competency.name);
  const [editDescription, setEditDescription] = useState(competency.description || "");

  const handleSaveName = () => {
    onChange({
      ...competency,
      name: editName,
      description: editDescription,
    });
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditName(competency.name);
    setEditDescription(competency.description || "");
    setIsEditingName(false);
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: "",
    };
    onChange({
      ...competency,
      questions: [...competency.questions, newQuestion],
    });
  };

  const handleUpdateQuestion = (questionId: string, text: string) => {
    onChange({
      ...competency,
      questions: competency.questions.map((q) =>
        q.id === questionId ? { ...q, text } : q
      ),
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    onChange({
      ...competency,
      questions: competency.questions.filter((q) => q.id !== questionId),
    });
  };

  return (
    <Card className="border-l-4 border-l-accent/50">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={onMoveUp}
              disabled={!canMoveUp}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={onMoveDown}
              disabled={!canMoveDown}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>

          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

          <div className="flex-1">
            {isEditingName ? (
              <div className="space-y-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Competency name"
                  className="font-semibold"
                  autoFocus
                />
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveName}>
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="cursor-pointer group"
                onClick={onToggle}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {index + 1}
                  </span>
                  <h4 className="font-semibold">{competency.name}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingName(true);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
                {competency.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {competency.description}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {competency.questions.length} question{competency.questions.length !== 1 ? "s" : ""}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggle}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-4 px-4">
          <div className="ml-10 space-y-3">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Questions
            </div>

            {competency.questions.length === 0 ? (
              <div className="text-sm text-muted-foreground italic py-4 text-center border border-dashed rounded-lg">
                No questions yet. Add your first question below.
              </div>
            ) : (
              <div className="space-y-2">
                {competency.questions.map((question, qIndex) => (
                  <div key={question.id} className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground mt-2.5 w-6 text-right">
                      {qIndex + 1}.
                    </span>
                    <Input
                      value={question.text}
                      onChange={(e) => handleUpdateQuestion(question.id, e.target.value)}
                      placeholder="Enter question text..."
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddQuestion}
              className="mt-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Question
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface CompetencyListProps {
  competencies: Competency[];
  onChange: (competencies: Competency[]) => void;
}

export function CompetencyList({ competencies, onChange }: CompetencyListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddCompetency = () => {
    const newCompetency: Competency = {
      id: crypto.randomUUID(),
      name: "New Competency",
      description: "",
      questions: [],
    };
    onChange([...competencies, newCompetency]);
    setExpandedIds((prev) => new Set(prev).add(newCompetency.id));
  };

  const handleUpdateCompetency = (index: number, updated: Competency) => {
    const newCompetencies = [...competencies];
    newCompetencies[index] = updated;
    onChange(newCompetencies);
  };

  const handleDeleteCompetency = (index: number) => {
    const comp = competencies[index];
    // Show confirmation if competency has questions
    if (comp.questions.length > 0) {
      setDeleteIndex(index);
    } else {
      onChange(competencies.filter((_, i) => i !== index));
    }
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      onChange(competencies.filter((_, i) => i !== deleteIndex));
      setDeleteIndex(null);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newCompetencies = [...competencies];
    [newCompetencies[index - 1], newCompetencies[index]] = [
      newCompetencies[index],
      newCompetencies[index - 1],
    ];
    onChange(newCompetencies);
  };

  const handleMoveDown = (index: number) => {
    if (index === competencies.length - 1) return;
    const newCompetencies = [...competencies];
    [newCompetencies[index], newCompetencies[index + 1]] = [
      newCompetencies[index + 1],
      newCompetencies[index],
    ];
    onChange(newCompetencies);
  };

  return (
    <div className="space-y-4">
      {competencies.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No competencies yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Add competencies to define what skills or behaviors will be assessed
            </p>
            <Button onClick={handleAddCompetency}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Competency
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {competencies.map((competency, index) => (
            <CompetencyEditor
              key={competency.id}
              competency={competency}
              index={index}
              isExpanded={expandedIds.has(competency.id)}
              onToggle={() => toggleExpanded(competency.id)}
              onChange={(updated) => handleUpdateCompetency(index, updated)}
              onDelete={() => handleDeleteCompetency(index)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              canMoveUp={index > 0}
              canMoveDown={index < competencies.length - 1}
            />
          ))}

          <Button variant="outline" onClick={handleAddCompetency}>
            <Plus className="h-4 w-4 mr-2" />
            Add Competency
          </Button>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Competency?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteIndex !== null && (
                <>
                  This will permanently delete "{competencies[deleteIndex]?.name}" and its{" "}
                  <strong>{competencies[deleteIndex]?.questions.length} questions</strong>.
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
