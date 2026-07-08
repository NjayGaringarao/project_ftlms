import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AttentionIssue, AttentionSection } from "@/features/home/lib/types";
import { CalendarClock, CircleCheckBig, ExternalLink, TriangleAlert } from "lucide-react";
import Link from "next/link";

type AttentionSectionsCardProps = {
  sections: AttentionSection[];
  academicTermId: string;
};

const ISSUE_LABEL: Record<AttentionIssue, string> = {
  NO_FACULTY: "No faculty",
  NO_SCHEDULE: "Unscheduled",
};

const ISSUE_CLASS: Record<AttentionIssue, string> = {
  NO_FACULTY: "border border-amber-500 text-amber-700",
  NO_SCHEDULE: "border text-foreground/60",
};

const AttentionSectionsCard = ({
  sections,
  academicTermId,
}: AttentionSectionsCardProps) => {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TriangleAlert className="w-4 h-4" />
          Sections That Need Attention
        </CardTitle>
        <p className="text-sm text-foreground/60">
          Classes still missing a faculty assignment or a schedule
        </p>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-foreground/60">
            <CircleCheckBig className="w-6 h-6 text-emerald-600" />
            <p className="text-sm">
              All classes have a faculty and a schedule.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {sections.map((section) => (
              <div
                key={section.sectionId}
                className="border border-border rounded-lg p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{section.sectionLabel}</p>
                  <Link
                    href={`/scheduler?academic_term_id=${academicTermId}&sectionId=${section.sectionId}`}
                    className="flex items-center gap-1 text-xs text-foreground/60 hover:text-foreground hover:underline"
                  >
                    <CalendarClock className="w-3.5 h-3.5" />
                    Open in Scheduler
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <ul className="mt-2 space-y-1">
                  {section.items.map((item, index) => (
                    <li
                      key={`${item.courseCode}-${index}`}
                      className="flex flex-wrap items-center gap-2 text-sm"
                    >
                      <span className="text-foreground/80">
                        {item.courseCode}
                      </span>
                      {item.issues.map((issue) => (
                        <span
                          key={issue}
                          className={`text-xs rounded px-1.5 py-0.5 ${ISSUE_CLASS[issue]}`}
                        >
                          {ISSUE_LABEL[issue]}
                        </span>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttentionSectionsCard;
