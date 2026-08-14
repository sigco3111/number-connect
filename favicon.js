/**
 * SVG 파비콘을 PNG로 변환하는 스크립트
 * 일부 브라우저는 SVG 파비콘을 지원하지 않기 때문에 PNG 파비콘으로 대체합니다.
 */
(function() {
  // SVG 파비콘 지원 확인
  const isSvgSupported = document.implementation.hasFeature(
    'http://www.w3.org/TR/SVG11/feature#Image',
    '1.1'
  );
  
  if (!isSvgSupported) {
    // SVG 파비콘을 PNG로 변환
    const svgIcon = document.querySelector('link[rel="icon"]');
    if (svgIcon) {
      const img = new Image();
      img.src = svgIcon.href;
      
      img.onload = function() {
        // 캔버스 생성
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        
        // SVG를 캔버스에 그리기
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 32, 32);
        
        // 캔버스에서 PNG 데이터 URL 생성
        const pngUrl = canvas.toDataURL('image/png');
        
        // 파비콘 링크 업데이트
        svgIcon.href = pngUrl;
      };
    }
  }
})(); 