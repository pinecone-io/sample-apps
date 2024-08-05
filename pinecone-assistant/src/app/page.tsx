import  Home  from './home'
// This app allows you to optionally disable sharing the Assistant's files and providing citations, via the 
// environment variables SHOW_ASSISTANT_FILES and SHOW_CITATIONS.

// This page.tsx is a server component, which allows us to read the values of the environment variables and pass them 
// to the Home component, which is a client component (intended to run on the client and use Browser API's). 
// The client component is responsible for rendering the UI, and needs to know the values of the environment variables
export default function Page() {
  const showAssistantFiles = process.env.SHOW_ASSISTANT_FILES === 'true'
  const showCitations = process.env.SHOW_CITATIONS !== 'false' // Defaults to true unless explicitly set to 'false'
  
  return <Home initialShowAssistantFiles={showAssistantFiles} showCitations={showCitations} />
}