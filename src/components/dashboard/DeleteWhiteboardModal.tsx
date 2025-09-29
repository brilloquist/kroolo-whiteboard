import React from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface DeleteWhiteboardModalProps {
  whiteboardId: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteWhiteboardModal = ({ onClose, onConfirm }: DeleteWhiteboardModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Delete Whiteboard</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 mb-6">
            Are you sure you want to delete this whiteboard? This action cannot be undone and will permanently remove all content and sharing settings.
          </p>

          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-red-400 font-medium mb-1">This will permanently:</h4>
                <ul className="text-red-300 text-sm space-y-1">
                  <li>• Delete all whiteboard content</li>
                  <li>• Remove all sharing permissions</li>
                  <li>• Remove access for all collaborators</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Whiteboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteWhiteboardModal;