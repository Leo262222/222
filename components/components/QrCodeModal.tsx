import React from 'react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  advisorName: string;
}

const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, imageUrl, advisorName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* 黑色背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* 弹窗主体 */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center animate-[scaleIn_0.2s_ease-out]">
        
        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
        >
          <i className="fas fa-times"></i>
        </button>

        {/* 标题 */}
        <h3 className="text-xl font-bold text-gray-800 mb-2">联系客服</h3>
        <p className="text-sm text-gray-500 mb-6 text-center leading-relaxed">
          为确保服务质量，请扫描下方二维码<br/>
          添加客服，我们将为您连接 <span className="font-bold text-purple-700">{advisorName}</span>
        </p>

        {/* 二维码区域 */}
        <div className="w-64 h-64 bg-gray-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center mb-4 p-2">
          {imageUrl ? (
            <img src={imageUrl} alt="客服二维码" className="w-full h-full object-contain rounded-lg" />
          ) : (
            <div className="text-center text-gray-400">
              <i className="fas fa-qrcode text-4xl mb-2 opacity-20"></i>
              <p className="text-xs">暂无二维码</p>
              <p className="text-xs scale-90">请在后台上传</p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400">
          长按识别二维码 或 截图保存
        </p>
      </div>
    </div>
  );
};

export default QrCodeModal;
