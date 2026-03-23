"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import type { TermListItem } from "@/lib/admin/terms";
import { formatAcademicTermLabel } from "@/utils/string";

type SegmentRouteConfig = {
  mode: "segment";
  baseSegment: string;
  resetNestedOnSelect?: boolean;
};

type QueryRouteConfig = {
  mode: "query";
  paramName: string;
  defaultToFirst?: boolean;
};

type TermSwitcherRouteConfig = SegmentRouteConfig | QueryRouteConfig;

type TermSwitcherProps = {
  terms: TermListItem[];
  selectedTermId?: string;
  routeConfig: TermSwitcherRouteConfig;
  title?: string;
  description?: string;
  emptyLabel?: string;
  buttonClassName?: string;
  buttonSize?: "sm" | "default";
  showSubtitle?: boolean;
  refreshOnSelect?: boolean;
};

const TermSwitcher = ({
  terms,
  selectedTermId: selectedTermIdProp,
  routeConfig,
  title = "Select Academic Term",
  description = "Search and switch the active academic term.",
  emptyLabel = "No academic terms found.",
  buttonClassName,
  buttonSize = "sm",
  showSubtitle = true,
  refreshOnSelect = false,
}: TermSwitcherProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedTermId =
    selectedTermIdProp ??
    (routeConfig.mode === "query"
      ? searchParams.get(routeConfig.paramName) ?? ""
      : (() => {
          const segments = pathname.split("/").filter(Boolean);
          const baseIndex = segments.indexOf(routeConfig.baseSegment);
          return baseIndex >= 0 ? segments[baseIndex + 1] ?? "" : "";
        })());

  const selectedTerm = terms.find((term) => term.id === selectedTermId) ?? null;

  const filteredTerms = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return terms;

    return terms.filter((term) => {
      const searchable = [
        term.code,
        term.name,
        term.academic_year.code,
        `${term.academic_year.start_year}-${term.academic_year.end_year}`,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalized);
    });
  }, [query, terms]);

  useEffect(() => {
    if (routeConfig.mode !== "query") return;
    if (!routeConfig.defaultToFirst) return;
    if (selectedTermId) return;
    const defaultId = terms[0]?.id ?? "";
    if (!defaultId) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set(routeConfig.paramName, defaultId);
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }, [routeConfig, selectedTermId, terms, pathname, router, searchParams]);

  const handleSelectTerm = (termId: string) => {
    if (routeConfig.mode === "query") {
      const next = new URLSearchParams(searchParams.toString());
      next.set(routeConfig.paramName, termId);
      const queryString = next.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
      if (refreshOnSelect) {
        router.refresh();
      }
      return;
    }

    const segments = pathname.split("/").filter(Boolean);
    const baseIndex = segments.indexOf(routeConfig.baseSegment);
    if (baseIndex === -1) {
      router.push(`/${routeConfig.baseSegment}/${termId}`);
      if (refreshOnSelect) {
        router.refresh();
      }
      return;
    }

    if (routeConfig.resetNestedOnSelect) {
      router.push(`/${routeConfig.baseSegment}/${termId}`);
    } else {
      const nextSegments = [...segments];
      if (nextSegments[baseIndex + 1]) {
        nextSegments[baseIndex + 1] = termId;
      } else {
        nextSegments.splice(baseIndex + 1, 0, termId);
      }
      router.push(`/${nextSegments.join("/")}`);
    }
    if (refreshOnSelect) {
      router.refresh();
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size={buttonSize}
        className={buttonClassName ?? "max-w-xs bg-background/95 mx-4 py-4"}
        onClick={() => setOpen(true)}
        title="Change academic term"
      >
        <Calendar className="h-4 w-4" />
        <span className="truncate text-base">
          {selectedTerm
            ? formatAcademicTermLabel(selectedTerm)
            : "Select academic term..."}
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      <AppDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        contentClassName="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
      >
        <div className="flex h-full flex-col gap-3 overflow-hidden">
          <Input
            placeholder="Search term"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="px-3 py-2"
          />

          <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
            {filteredTerms.length === 0 && (
              <p className="p-4 text-center text-sm text-foreground/70">
                {emptyLabel}
              </p>
            )}

            {filteredTerms.map((term) => {
              const isSelected = term.id === selectedTermId;

              return (
                <ListItemSmall
                  key={term.id}
                  title={formatAcademicTermLabel(term)}
                  subtitle={showSubtitle ? [term.code] : []}
                  isSelected={isSelected}
                  onClick={() => {
                    handleSelectTerm(term.id);
                    setOpen(false);
                  }}
                  icon={<Calendar className="h-6 w-6 text-background/70" />}
                />
              );
            })}
          </div>
        </div>
      </AppDialog>
    </>
  );
};

export default TermSwitcher;
