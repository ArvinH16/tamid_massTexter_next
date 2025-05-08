// This animation is not currently being used in this application. 
'use client';

export function ConnectionAnimation() {
    return (
        <section>
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="pb-12 md:pb-2">
                    <div className="relative flex h-[324px] items-center justify-center">
                        {/* Vertical top line */}
                        <div className="absolute left-1/2 top-0 h-[100px] sm:h-[162px] w-[2px] sm:w-[3px] -translate-x-1/2 bg-gradient-to-b from-transparent via-gray-200 to-transparent mix-blend-overlay before:absolute before:left-0 before:top-0 before:h-full before:w-full before:animate-[line_4s_ease-in-out_infinite_5s_both] before:bg-gradient-to-b before:from-transparent before:via-blue-500 before:to-transparent"></div>

                        {/* Vertical bottom line */}
                        <div className="absolute bottom-0 left-1/2 h-[100px] sm:h-[162px] w-[2px] sm:w-[3px] -translate-x-1/2 bg-gradient-to-t from-transparent via-gray-200 to-transparent mix-blend-overlay before:absolute before:left-0 before:top-0 before:h-full before:w-full before:animate-[line_4s_ease-in-out_infinite_5s_both] before:bg-gradient-to-t before:from-transparent before:via-blue-500 before:to-transparent"></div>

                        {/* Left line */}
                        <div className="absolute left-1/2 top-1/2 h-[2px] sm:h-[3px] w-[180px] sm:w-[300px] -translate-x-full bg-gradient-to-r from-transparent via-gray-200 to-transparent mix-blend-overlay rotate-180 before:absolute before:left-0 before:top-0 before:h-full before:w-[80px] sm:before:w-[150px] before:animate-[line_4s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-blue-500 before:to-transparent"></div>

                        {/* Right line */}
                        <div className="absolute left-1/2 top-1/2 h-[2px] sm:h-[3px] w-[180px] sm:w-[300px] bg-gradient-to-r from-transparent via-gray-200 to-transparent mix-blend-overlay before:absolute before:left-0 before:top-0 before:h-full before:w-[80px] sm:before:w-[150px] before:animate-[line_4s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-blue-500 before:to-transparent"></div>

                        {/* Main middle circle */}
                        <div className="absolute before:absolute before:-inset-2 sm:before:-inset-3 before:animate-[spin_1.5s_linear_infinite] before:rounded-full before:border before:border-transparent before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] before:[background:conic-gradient(from_180deg,transparent,theme(colors.blue.500))_border-box]">
                            <div className="animate-[breath_8s_ease-in-out_infinite_both]">
                                <div className="flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-white shadow-lg shadow-black/[0.03] before:absolute before:inset-0 before:m-[8.334%] before:rounded-[inherit] before:border before:border-gray-700/5 before:bg-gray-200/60 before:[mask-image:linear-gradient(to_bottom,black,transparent)]">
                                    <svg 
                                        className="relative w-8 h-8 sm:w-10 sm:h-10 text-purple-600" 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        viewBox="0 0 24 24" 
                                        fill="currentColor"
                                    >
                                        <path d="M10.5 18.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
                                        <path fillRule="evenodd" d="M8.625.75A3.375 3.375 0 005.25 4.125v15.75a3.375 3.375 0 003.375 3.375h6.75a3.375 3.375 0 003.375-3.375V4.125A3.375 3.375 0 0015.375.75h-6.75zM7.5 4.125C7.5 3.504 8.004 3 8.625 3H9.75v.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V3h1.125c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 017.5 19.875V4.125z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Left square */}
                        <div className="absolute left-[calc(50%-120px)] sm:left-[calc(50%-200px)] top-1/2 -translate-y-1/2">
                            <div className="animate-[breath_7s_ease-in-out_3s_infinite_both]">
                                <div className="flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white shadow-[0_0_20px_rgba(122,183,126,0.6)] before:absolute before:inset-0 before:m-[8.334%] before:rounded-[inherit] before:border before:border-gray-200/60 before:bg-gray-200/60 before:[mask-image:linear-gradient(to_bottom,black,transparent)]">
                                    <svg 
                                        className="relative w-5 h-5 sm:w-6 sm:h-6 text-purple-600" 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        viewBox="0 0 24 24" 
                                        fill="currentColor"
                                    >
                                        <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Right square */}
                        <div className="absolute right-[calc(50%-120px)] sm:right-[calc(50%-200px)] top-1/2 -translate-y-1/2">
                            <div className="animate-[breath_7s_ease-in-out_3.5s_infinite_both]">
                                <div className="flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white shadow-[0_0_20px_rgba(122,183,126,0.6)] before:absolute before:inset-0 before:m-[8.334%] before:rounded-[inherit] before:border before:border-gray-200/60 before:bg-gray-200/60 before:[mask-image:linear-gradient(to_bottom,black,transparent)]">
                                    <svg 
                                        className="relative w-5 h-5 sm:w-6 sm:h-6 text-purple-600" 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        viewBox="0 0 24 24" 
                                        fill="currentColor"
                                    >
                                        <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                                        <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Left phone circle */}
                        <div className="absolute left-[calc(50%-180px)] sm:left-[calc(50%-300px)] top-1/2 -translate-y-1/2">
                            <div className="animate-[breath_6s_ease-in-out_2s_infinite_both]">
                                <div className="flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-gray-200/60 bg-white shadow-[0_4px_10px_rgba(124,58,237,0.6)]">
                                    <svg 
                                        className="relative w-4 h-4 sm:w-5 sm:h-5 text-purple-600" 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        viewBox="0 0 24 24" 
                                        fill="currentColor"
                                    >
                                        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Right phone circle */}
                        <div className="absolute right-[calc(50%-180px)] sm:right-[calc(50%-300px)] top-1/2 -translate-y-1/2">
                            <div className="animate-[breath_6s_ease-in-out_4s_infinite_both]">
                                <div className="flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-gray-200/60 bg-white shadow-[0_4px_10px_rgba(124,58,237,0.6)]">
                                    <svg 
                                        className="relative w-4 h-4 sm:w-5 sm:h-5 text-purple-600" 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        viewBox="0 0 24 24" 
                                        fill="currentColor"
                                    >
                                        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Top phone circle */}
                        <div className="absolute left-1/2 top-0 -translate-x-1/2">
                            <div className="animate-[breath_6s_ease-in-out_2s_infinite_both]">
                                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-gray-200/60 bg-white shadow-[0_4px_10px_rgba(124,58,237,0.6)]">
                                    <svg 
                                        className="relative w-4 h-4 sm:w-5 sm:h-5 text-purple-600" 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        viewBox="0 0 24 24" 
                                        fill="currentColor"
                                    >
                                        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Bottom phone circle */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                            <div className="animate-[breath_6s_ease-in-out_2s_infinite_both]">
                                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-gray-200/60 bg-white shadow-[0_4px_10px_rgba(124,58,237,0.6)]">
                                    <svg 
                                        className="relative w-4 h-4 sm:w-5 sm:h-5 text-purple-600" 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        viewBox="0 0 24 24" 
                                        fill="currentColor"
                                    >
                                        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
} 