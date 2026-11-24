import { useEffect } from 'react';

export const usePosShortcuts = ({
    safeCartTabs,
    searchRef,
    custSearchRef,
    activeTabId,
    handleFileUpload,
    createNewTab,
    onQuickCheckout,
    onFocusCashInput
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
            if (e.key === 'F2') {
                e.preventDefault();
                custSearchRef?.current?.querySelector('input')?.focus();
            } else if (e.key === 'F3') { 
                e.preventDefault(); 
                searchRef.current?.querySelector('input')?.focus(); 
            } else if (e.key === 'F4') {
                e.preventDefault();
                if (typeof onFocusCashInput === 'function') {
                    onFocusCashInput();
                }
            } else if (e.altKey && (e.key === 'n' || e.key === 'N')) {
                e.preventDefault();
                if (typeof createNewTab === 'function') {
                    createNewTab();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (typeof onQuickCheckout === 'function') {
                    onQuickCheckout();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchRef, custSearchRef, createNewTab, onQuickCheckout, onFocusCashInput]);

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
