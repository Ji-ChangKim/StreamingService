import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { parseSubmissionFile } from '../../utils/submissionFileParser';
import {
  validateAllSubmissions,
  ValidSubmissionItem,
  InvalidSubmissionRow,
} from '../../utils/submissionValidator';
import {
  downloadExcelTemplate,
  downloadCsvTemplate,
} from '../../utils/submissionTemplateGenerator';
import { uploadBatchSubmissions } from '../../services/adminService';

interface SubmissionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (insertedCount: number) => void;
}

export const SubmissionUploadModal: React.FC<SubmissionUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [validItems, setValidItems] = useState<ValidSubmissionItem[]>([]);
  const [invalidItems, setInvalidItems] = useState<InvalidSubmissionRow[]>([]);
  const [previewTab, setPreviewTab] = useState<'valid' | 'invalid'>('valid');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedFile(null);
    setIsParsing(false);
    setParseError(null);
    setValidItems([]);
    setInvalidItems([]);
    setPreviewTab('valid');
    setIsUploading(false);
    setUploadError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleProcessFile = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValidExt) {
      setParseError('엑셀(.xlsx, .xls) 또는 CSV(.csv) 파일만 업로드할 수 있습니다.');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setUploadError(null);

    try {
      const rawRows = await parseSubmissionFile(file);
      const summary = validateAllSubmissions(rawRows);

      setValidItems(summary.validItems);
      setInvalidItems(summary.invalidItems);

      if (summary.validCount > 0) {
        setPreviewTab('valid');
      } else if (summary.invalidCount > 0) {
        setPreviewTab('invalid');
      }
    } catch (err: any) {
      setParseError(err?.message || '파일을 파싱하는 도중 오류가 발생했습니다.');
      setValidItems([]);
      setInvalidItems([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleExecuteUpload = async () => {
    if (validItems.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    const result = await uploadBatchSubmissions(validItems);
    setIsUploading(false);

    if (result.success) {
      onSuccess(result.insertedCount || validItems.length);
      handleClose();
    } else {
      setUploadError(result.error || result.message || '일괄 업로드 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-[20px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-[10px] text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">심사 대기열 CSV / 엑셀 일괄 업로드</h2>
              <p className="text-xs text-slate-400">대량의 신규 데뷔 신청서를 일괄 등록합니다.</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-800 rounded-[8px] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Template Download Guide Banner */}
          <div className="p-4 rounded-[14px] bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-blue-600" />
                표준 작성 템플릿 양식
              </p>
              <p className="text-[11px] text-blue-700 font-medium">
                작성 형식에 맞춘 공식 엑셀(.xlsx) 및 한글 깨짐 방지 CSV(.csv) 양식을 내려받아 작성하세요.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={downloadExcelTemplate}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-[8px] transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>엑셀 양식 (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-extrabold text-xs rounded-[8px] transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>CSV 양식 (.csv)</span>
              </button>
            </div>
          </div>

          {/* File Upload / Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[16px] p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/20'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/10'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-white rounded-full shadow-xs border border-slate-200">
                <UploadCloud className={`w-8 h-8 ${selectedFile ? 'text-emerald-500' : 'text-blue-600'}`} />
              </div>

              {selectedFile ? (
                <div>
                  <p className="text-sm font-black text-slate-900 flex items-center gap-1.5 justify-center">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • 클릭하여 다른 파일 선택
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    파일을 이곳에 끌어다 놓거나 <span className="text-blue-600 underline font-extrabold">클릭하여 선택</span>하세요
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">지원 형식: .xlsx, .xls, .csv</p>
                </div>
              )}
            </div>
          </div>

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="py-6 flex items-center justify-center gap-2 text-xs font-bold text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>파일 데이터 파싱 및 유효성 검증 중...</span>
            </div>
          )}

          {/* Error Message */}
          {parseError && (
            <div className="p-3.5 rounded-[10px] bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Upload Server Error */}
          {uploadError && (
            <div className="p-3.5 rounded-[10px] bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Preview Section */}
          {(validItems.length > 0 || invalidItems.length > 0) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('valid')}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      previewTab === 'valid'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>정상 등록 가능 ({validItems.length}건)</span>
                  </button>

                  {invalidItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewTab('invalid')}
                      className={`px-3 py-1.5 rounded-[8px] text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                        previewTab === 'invalid'
                          ? 'bg-red-600 text-white shadow-2xs'
                          : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>수정 필요 오류 ({invalidItems.length}건)</span>
                    </button>
                  )}
                </div>

                <span className="text-xs text-slate-500 font-bold">
                  총 {validItems.length + invalidItems.length}행 검증 완료
                </span>
              </div>

              {/* Tab 1: Valid Items Table */}
              {previewTab === 'valid' && (
                <div className="border border-slate-200 rounded-[12px] overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-700 font-extrabold">
                        <tr>
                          <th className="px-3 py-2 text-center w-12">행</th>
                          <th className="px-3 py-2">스트리머명</th>
                          <th className="px-3 py-2">플랫폼</th>
                          <th className="px-3 py-2">데뷔 일시</th>
                          <th className="px-3 py-2">소속사</th>
                          <th className="px-3 py-2">방송국 채널</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {validItems.map((item) => (
                          <tr key={item.rowIndex} className="hover:bg-slate-50 transition-colors">
                            <td className="px-3 py-2 text-center font-mono font-bold text-slate-400">
                              {item.rowIndex}
                            </td>
                            <td className="px-3 py-2 font-bold text-slate-900">
                              {item.displayName}
                            </td>
                            <td className="px-3 py-2">
                              {item.platform === 'CHZZK' ? (
                                <span className="bg-[#00FFA3] text-black text-[10px] font-extrabold px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                  <img src="/icons/chzzk_icon.png" alt="CHZZK" className="w-3 h-3" /> 치지직
                                </span>
                              ) : item.platform === 'SOOP' ? (
                                <span className="bg-[#0F172A] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                  <img src="/icons/soop/soop_symbol_white.svg" alt="SOOP" className="w-3 h-3" /> SOOP
                                </span>
                              ) : item.platform === 'YOUTUBE' ? (
                                <span className="bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                  <img src="/icons/youtube_icon.png" alt="YouTube" className="h-3" /> YouTube
                                </span>
                              ) : (
                                <span className="bg-purple-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                  <img src="/icons/twitch_icon.svg" alt="Twitch" className="w-3 h-3" /> Twitch
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-mono font-bold text-blue-700">
                              {item.debutDate} {item.debutTime}
                            </td>
                            <td className="px-3 py-2 text-slate-600 font-medium">
                              {item.agencyName}
                            </td>
                            <td className="px-3 py-2">
                              <a
                                href={item.channelUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center gap-1 font-bold truncate max-w-[180px]"
                              >
                                링크 확인 <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: Invalid Items Table */}
              {previewTab === 'invalid' && (
                <div className="border border-red-200 rounded-[12px] overflow-hidden bg-red-50/20">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-red-100/70 sticky top-0 border-b border-red-200 text-red-900 font-extrabold">
                        <tr>
                          <th className="px-3 py-2 text-center w-12">행</th>
                          <th className="px-3 py-2">스트리머명</th>
                          <th className="px-3 py-2">오류 내용 (사유)</th>
                          <th className="px-3 py-2">입력된 채널 URL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {invalidItems.map((inv) => (
                          <tr key={inv.rowIndex} className="hover:bg-red-50/50 transition-colors">
                            <td className="px-3 py-2 text-center font-mono font-bold text-red-500">
                              {inv.rowIndex}
                            </td>
                            <td className="px-3 py-2 font-bold text-slate-800">
                              {inv.row.displayName || '(비어있음)'}
                            </td>
                            <td className="px-3 py-2 text-red-700 font-bold space-y-0.5">
                              {inv.errors.map((err, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  • {err}
                                </div>
                              ))}
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] text-slate-500 truncate max-w-[180px]">
                              {inv.row.channelUrl || '(비어있음)'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-[10px] text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            취소 / 닫기
          </button>

          <button
            type="button"
            onClick={handleExecuteUpload}
            disabled={validItems.length === 0 || isUploading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-[10px] transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>심사 대기열에 일괄 등록 중...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>
                  정상 {validItems.length}건 심사 대기열에 일괄 등록
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
