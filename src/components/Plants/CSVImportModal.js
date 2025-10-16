import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';

function CSVImportModal({ isOpen, onClose, onImport, loading = false }) {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    parseCSV(selectedFile);
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const data = lines.slice(1).filter(line => line.trim()).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });
          return row;
        });

        setCsvData(data);
        setPreview(data.slice(0, 5)); // Show first 5 rows as preview
      } catch (error) {
        setError('Failed to parse CSV file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvData || csvData.length === 0) {
      setError('No data to import');
      return;
    }

    try {
      await onImport(csvData, updateExisting);
      handleClose();
    } catch (error) {
      setError(error.message || 'Failed to import CSV data');
    }
  };

  const handleClose = () => {
    setFile(null);
    setCsvData(null);
    setPreview(null);
    setUpdateExisting(false);
    setError(null);
    onClose();
  };

  const downloadTemplate = () => {
    const template = [
      'Name,Type,Variety,Category,Description,Health,Growth Stage,Plot,Planted Date,Expected Harvest Date,Location',
      'Tomato Plant,Tomato,Cherry,vegetable,Small cherry tomatoes,excellent,seedling,Plot A,2024-01-15,2024-04-15,Garden Area 1',
      'Basil Plant,Basil,Sweet,herb,Aromatic basil for cooking,good,seedling,Plot B,2024-01-20,2024-03-20,Herb Garden',
      'Old Tree,Apple,Red Delicious,tree,Old apple tree,deceased,mature,Plot C,2020-03-01,2020-09-01,Orchard Area'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plants_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Import Plants from CSV
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  CSV files only
                </span>
              </label>
            </div>
            {file && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <FileText size={16} />
                <span>{file.name}</span>
                <span>({csvData ? csvData.length : 0} rows)</span>
              </div>
            )}
          </div>

          {/* Template Download */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Need a template?
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Download our CSV template to see the required format
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download size={16} />
                <span>Download Template</span>
              </button>
            </div>
          </div>

          {/* Import Options */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                className="rounded border-gray-300 text-plant-green-600 focus:ring-plant-green-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Update existing plants (by name and type)
              </span>
            </label>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview (first 5 rows)
              </h3>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {Object.keys(preview[0] || {}).map((header) => (
                          <th
                            key={header}
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {preview.map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, valueIndex) => (
                            <td
                              key={valueIndex}
                              className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                            >
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!csvData || loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Import Plants</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CSVImportModal;
