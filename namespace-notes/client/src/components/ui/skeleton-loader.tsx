export const SkeletonLoader = () => {
    return (
        <div className="animate-pulse gap-3 flex flex-col">
            <div className="h-6 bg-gray-200 rounded-md w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded-md w-2/3 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-2"></div>
        </div>
    );
};
