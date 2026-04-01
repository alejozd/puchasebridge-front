import React from 'react';

interface PageTitleProps {
    title: string;
    id?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, id }) => {
    return <h1 className="page-title app-title" id={id}>{title}</h1>;
};

export default PageTitle;
