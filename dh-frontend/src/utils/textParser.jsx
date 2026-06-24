import React from 'react';

/**
 * Parses a string containing [terms] and [privacy] tags and replaces them with React links.
 * Also handles newlines.
 * 
 * @param {string} text - The raw text to parse
 * @param {string} termsUrl - URL for terms of service
 * @param {string} privacyUrl - URL for privacy policy
 * @param {string} linkClassName - CSS classes for the links
 * @returns {React.ReactNode}
 */
export const parseConsentText = (text, termsUrl = '/terms-of-service', privacyUrl = '/privacy-policy', linkClassName = "text-indigo-600 hover:text-indigo-800 font-medium underline") => {
    if (!text) return null;

    // Split by newlines first
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
        // Split by both [terms] and [privacy] to keep them as separate tokens
        const parts = line.split(/(\[terms\]|\[privacy\])/g);
        
        const parsedLine = parts.map((part, index) => {
            if (part === '[terms]') {
                return (
                    <a 
                        key={index} 
                        href={termsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={linkClassName}
                    >
                        เงื่อนไขการให้บริการ
                    </a>
                );
            }
            if (part === '[privacy]') {
                return (
                    <a 
                        key={index} 
                        href={privacyUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={linkClassName}
                    >
                        นโยบายความเป็นส่วนตัว
                    </a>
                );
            }
            return <React.Fragment key={index}>{part}</React.Fragment>;
        });

        return (
            <React.Fragment key={lineIndex}>
                {parsedLine}
                {lineIndex < lines.length - 1 && <br />}
            </React.Fragment>
        );
    });
};
