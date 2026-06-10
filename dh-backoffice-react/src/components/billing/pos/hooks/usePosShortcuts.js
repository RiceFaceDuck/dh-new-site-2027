import { useEffect } from 'react';

export const usePosShortcuts = ({
    safeCartTabs,
    searchRef,
    activeTabId,
    handleFileUpload
}) => {
    useEffect(() => {
        const handleBeforeUnload = (e) => { 
            if (safeCartTabs.some(tab => tab.items.length > 0)) { 
                e.preventDefault(); 
                e.returnValue = ''; 
            } 
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [safeCartTabs]);

    useEffect(() => {
        const handleKeyDown = (e) => { 
            if (e.key === 'F3') { 
                e.preventDefault(); 
                searchRef.current?.querySelector('input')?.focus(); 
            } 
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchRef]);

    useEffect(() => {
        const handleGlobalPaste = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    handleFileUpload({ target: { files: [blob] } });
                }
            }
        };
        window.addEventListener('paste', handleGlobalPaste);
        return () => window.removeEventListener('paste', handleGlobalPaste);
    }, [activeTabId, handleFileUpload]);
};
