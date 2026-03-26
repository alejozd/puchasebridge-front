import React from 'react';

interface PageTitleProps {
    title: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title }) => {
    return <h1 className="page-title app-title">{title}</h1>;
};

export default PageTitle;
