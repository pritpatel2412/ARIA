import { useRef, useState, useCallback } from "react";
import { Upload, FileText, X, CheckCircle, Loader2, ChevronDown, ChevronUp, User, MapPin, Briefcase } from "lucide-react";
import { parseResume, type ParsedResume } from "@/lib/api";

interface ResumeUploadProps {
  onResumeParsed: (resume: ParsedResume | null) => void;
  parsedResume: ParsedResume | null;
}

const SUPPORTED_TYPES: Record<string, string> = {
  "application/pdf": "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword": "application/msword",
  "text/plain": "text/plain",
};

const TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/msword": "DOC",
  "text/plain": "TXT",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:application/pdf;base64,")
      const base64 = result.split(",")[1];
      if (!base64) reject(new Error("Failed to read file"));
      else resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ResumeUpload({ onResumeParsed, parsedResume }: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    const mimeType = file.type || "application/octet-stream";
    if (!SUPPORTED_TYPES[mimeType]) {
      setError("Unsupported file type. Please upload a PDF, DOCX, DOC, or TXT file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Please upload a resume under 10 MB.");
      return;
    }

    setFileName(file.name);
    setIsLoading(true);

    try {
      const base64 = await fileToBase64(file);
      const resume = await parseResume(base64, mimeType, file.name);
      onResumeParsed(resume);
    } catch (err) {
      setError((err as Error).message ?? "Failed to parse resume. Please try again.");
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  }, [onResumeParsed]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const handleRemove = () => {
    onResumeParsed(null);
    setFileName(null);
    setError(null);
    setShowDetails(false);
  };

  // State: resume successfully parsed
  if (parsedResume) {
    return (
      <div className="w-full rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/20 border border-[#F59E0B]/30 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#00FF88] flex-shrink-0" />
              <span className="text-xs font-mono text-[#00FF88]">Resume ready</span>
            </div>
            <p className="text-sm font-mono text-[#F8FAFC] truncate">{parsedResume.name}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="p-1.5 text-[#6B7280] hover:text-[#F59E0B] transition-colors"
              title={showDetails ? "Hide details" : "Show details"}
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={handleRemove}
              className="p-1.5 text-[#6B7280] hover:text-[#F87171] transition-colors"
              title="Remove resume"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {showDetails && (
          <div className="border-t border-[#F59E0B]/20 px-4 py-3 space-y-3">
            {/* Skills */}
            {parsedResume.skills.length > 0 && (
              <div>
                <p className="text-xs font-mono text-[#4B5563] uppercase tracking-wider mb-1.5">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {parsedResume.skills.slice(0, 12).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md bg-[#1E1E2E] border border-[#374151] text-[#9CA3AF] text-xs font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                  {parsedResume.skills.length > 12 && (
                    <span className="px-2 py-0.5 text-[#4B5563] text-xs font-mono">+{parsedResume.skills.length - 12} more</span>
                  )}
                </div>
              </div>
            )}

            {/* Experience */}
            {parsedResume.experience.length > 0 && (
              <div>
                <p className="text-xs font-mono text-[#4B5563] uppercase tracking-wider mb-1.5">Experience</p>
                <div className="space-y-1">
                  {parsedResume.experience.slice(0, 3).map((exp, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Briefcase className="w-3 h-3 text-[#4B5563] flex-shrink-0" />
                      <span className="text-xs font-mono text-[#9CA3AF]">
                        {exp.role}{exp.company ? ` @ ${exp.company}` : ""}
                        {exp.years ? ` (${exp.years}y)` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Target roles */}
              {parsedResume.preferredRoles.length > 0 && (
                <div className="flex-1">
                  <p className="text-xs font-mono text-[#4B5563] uppercase tracking-wider mb-1.5">
                    <User className="w-3 h-3 inline mr-1" />Target roles
                  </p>
                  <p className="text-xs font-mono text-[#9CA3AF]">{parsedResume.preferredRoles.join(", ")}</p>
                </div>
              )}

              {/* Location */}
              {parsedResume.locationPreference && (
                <div>
                  <p className="text-xs font-mono text-[#4B5563] uppercase tracking-wider mb-1.5">
                    <MapPin className="w-3 h-3 inline mr-1" />Location
                  </p>
                  <p className="text-xs font-mono text-[#9CA3AF]">{parsedResume.locationPreference}</p>
                </div>
              )}
            </div>

            {/* Summary */}
            {parsedResume.summary && (
              <div>
                <p className="text-xs font-mono text-[#4B5563] uppercase tracking-wider mb-1.5">Summary</p>
                <p className="text-xs font-mono text-[#6B7280] leading-relaxed">{parsedResume.summary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // State: uploading / parsing
  if (isLoading) {
    return (
      <div className="w-full rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 px-4 py-4 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-[#F59E0B] animate-spin flex-shrink-0" />
        <div>
          <p className="text-sm font-mono text-[#F8FAFC]">Parsing resume...</p>
          <p className="text-xs font-mono text-[#4B5563]">{fileName}</p>
        </div>
      </div>
    );
  }

  // State: idle / error
  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleInputChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`w-full rounded-xl border-2 border-dashed px-4 py-4 flex items-center gap-3 transition-all text-left ${
          isDragging
            ? "border-[#F59E0B] bg-[#F59E0B]/10"
            : "border-[#1E1E2E] hover:border-[#F59E0B]/40 hover:bg-[#F59E0B]/5"
        }`}
      >
        <div className="w-9 h-9 rounded-lg bg-[#1E1E2E] border border-[#374151] flex items-center justify-center flex-shrink-0">
          <Upload className="w-4 h-4 text-[#6B7280]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono text-[#9CA3AF]">
            {isDragging ? "Drop your resume here" : "Upload resume"}
          </p>
          <p className="text-xs font-mono text-[#4B5563]">PDF, DOCX, or TXT · Max 10 MB</p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#1E1E2E] border border-[#374151] text-[#6B7280] flex-shrink-0">
          Browse
        </span>
      </button>

      {error && (
        <p className="mt-2 text-xs font-mono text-[#F87171] flex items-start gap-1.5">
          <X className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
