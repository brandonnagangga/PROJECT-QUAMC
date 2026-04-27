import { useEffect } from 'react';

const facebookPages = [
    {
        id: 1,
        url: 'https://www.facebook.com/tagoloancommunitycollegeofficial',
        name: 'Tagoloan Community College'
    },
    {
        id: 2,
        url: 'https://www.facebook.com/TCC.CIT',
        name: 'TCC CIT'
    },
    {
        id: 3,
        url: 'https://www.facebook.com/TCCQuill',
        name: 'TCC Quill'
    }
];

export default function FacebookPagesCarousel() {
    const CARD_WIDTH = 300;
    const CARD_HEIGHT = 430;

    useEffect(() => {
        const parse = () => {
            if ((window as any).FB?.XFBML?.parse) {
                (window as any).FB.XFBML.parse();
            }
        };

        parse();

        if (document.readyState !== 'complete') {
            window.addEventListener('load', parse, { once: true });
            return () => window.removeEventListener('load', parse);
        }
    }, []);

    return (
        <div className="fb-carousel" role="region" aria-label="Facebook pages feed">
            <div className="fb-carousel__track">
                {facebookPages.map((page) => (
                    <div key={page.id} className="fb-carousel__item">
                        <div
                            className="fb-page"
                            data-href={page.url}
                            data-tabs="timeline"
                            data-width={String(CARD_WIDTH)}
                            data-height={String(CARD_HEIGHT)}
                            data-small-header="true"
                            data-adapt-container-width="false"
                            data-hide-cover="true"
                            data-show-facepile="false"
                        >
                            <blockquote cite={page.url} className="fb-xfbml-parse-ignore">
                                <a href={page.url}>{page.name}</a>
                            </blockquote>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
