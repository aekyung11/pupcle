// https://github.com/structurizr/examples/blob/fd892776352a5ab9759b4d91391ead623b3f1a3d/dsl/big-bank-plc/workspace.dsl

/*
 * Notes:
 * PostGraphile is a GraphQL API server built on top of Node.js and PostgreSQL.
 * Apollo is a front-end state management library fro GraphQL APIs.
*/
workspace "PupCle" "This is a health-tracking app for pet dogs." {

    model {
        user = person "PupCle User" "A PupCle user, with a pet dog." "Pet Owner"

        enterprise "PupCle" {
            supportStaff = person "Customer Service Staff" "Customer service staff within the bank." "Bank Staff"
            backoffice = person "Back Office Staff" "Administration and support staff within the bank." "Bank Staff"

            s3 = softwaresystem "S3 Object Storage" "S3-compatible object storage system for user-uploaded images, videos, etc." "Existing System"
            email = softwaresystem "E-mail System" "AWS Simple Email Service (SES)." "Existing System"
            kakaoMap = softwaresystem "Kakao Map API" "Location Service." "Existing System"
            atm = softwaresystem "ATM" "Allows customers to withdraw cash." "Existing System"

            pupcleSystem = softwaresystem "PupCle" "Allows customers to view information about their bank accounts, and make payments." {
                singlePageApplication = container "Single-Page Application" "Provides PupCle functionality to users via their web browser." "TypeScript, React.js, Apollo, TensorFlow.js" "Web Browser"
                mobileApp = container "Mobile App" "Provides PupCle functionality to users via their mobile device." "TypeScript, React Native, Apollo, TensorFlow.js" "Mobile App"
                apiService = container "Web and API Service" "Provides functionality via HTML and a GraphQL JSON/HTTPS API." "Node.js, Next.js, PostGraphile" {
                    signinController = component "Sign In Controller" "Allows users to sign in to PupCle." "Spring MVC Rest Controller"
                    accountsSummaryController = component "Accounts Summary Controller" "Provides customers with a summary of their bank accounts." "Spring MVC Rest Controller"
                    resetPasswordController = component "Reset Password Controller" "Allows users to reset their passwords with a single use URL." "Spring MVC Rest Controller"
                    securityComponent = component "Security Component" "Provides functionality related to signing in, changing passwords, etc." "Spring Bean"
                    s3Client = component "S3 Client" "A facade for an S3-compatible object storage system." "S3"
                }
                workerService = container "Job Queue" "Provides a job queue for emails, notifications, reports, etc." "Graphile Worker" {
                    emailComponent = component "E-mail Component" "Sends e-mails to users." "Spring Bean"
                }
                database = container "Database" "Stores user information, hashed authentication credentials, health records, etc." "PostgreSQL" "Database" {
                    jobQueue = component "Job Queue" "Stores jobs." "PostgreSQL"
                }
            }
        }

        # relationships between people and software systems
        user -> pupcleSystem "Views account balances, and makes payments using"
        pupcleSystem -> s3 "Gets account information from, and makes payments using"
        pupcleSystem -> email "Sends e-mail using"
        email -> user "Sends e-mails to" "SMTP"
        user -> supportStaff "Asks questions to" "Telephone"
        supportStaff -> s3 "Uses"
        user -> atm "Withdraws cash using"
        atm -> s3 "Uses"
        backoffice -> s3 "Uses"

        # relationships to/from containers
        user -> singlePageApplication "Views pet health and enters updates using"
        user -> mobileApp "Views pet health and enters updates using"

        workerService -> database "Processes jobs from" "SQL/TCP"
        apiService -> database "Reads from and writes to, create jobs" "SQL/TCP"
        singlePageApplication -> s3 "Download/upload images, videos, etc" "Binary/HTTPS"
        mobileApp -> s3 "Download/upload images, videos, etc" "Binary/HTTPS"

        singlePageApplication -> kakaoMap "Makes API calls to" "JSON/HTTPS"
        mobileApp -> kakaoMap "Makes API calls to" "JSON/HTTPS"
        apiService -> kakaoMap "Makes API calls to" "JSON/HTTPS"
        workerService -> kakaoMap "Makes API calls to" "JSON/HTTPS"

        # relationships to/from components
        singlePageApplication -> signinController "Loads HTML, Makes API calls to" "HTML, GraphQL JSON/HTTPS"
        singlePageApplication -> accountsSummaryController "Loads HTML, Makes API calls to" "HTML, GraphQL JSON/HTTPS"
        singlePageApplication -> resetPasswordController "Loads HTML, Makes API calls to" "HTML, GraphQL JSON/HTTPS"
        mobileApp -> signinController "Makes API calls to" "GraphQL JSON/HTTPS"
        mobileApp -> accountsSummaryController "Makes API calls to" "GraphQL JSON/HTTPS"
        mobileApp -> resetPasswordController "Makes API calls to" "GraphQL JSON/HTTPS"
        signinController -> securityComponent "Uses"
        accountsSummaryController -> s3Client "Uses"
        resetPasswordController -> securityComponent "Uses"
        resetPasswordController -> jobQueue "Uses"
        securityComponent -> database "Reads from and writes to, create jobs" "SQL/TCP"
        s3Client -> s3 "Makes API calls to" "Binary/HTTPS"
        emailComponent -> email "Sends e-mail using" "JSON/HTTPS"

        deploymentEnvironment "Development" {
            deploymentNode "Developer Laptop" "" "Microsoft Windows 10 or Apple macOS" {
                deploymentNode "Web Browser" "" "Chrome, Firefox, Safari, or Edge" {
                    developerSinglePageApplicationInstance = containerInstance singlePageApplication
                }
                deploymentNode "Docker Container - Web Server" "" "Docker" {
                    deploymentNode "Apache Tomcat" "" "Apache Tomcat 8.x" {
                        developerApiServiceInstance = containerInstance apiService
                    }
                }
                deploymentNode "Docker Container - Database Server" "" "Docker" {
                    deploymentNode "Database Server" "" "Oracle 12c" {
                        developerDatabaseInstance = containerInstance database
                    }
                }
            }
            deploymentNode "PupCle" "" "PupCle data center" "" {
                deploymentNode "bigbank-dev001" "" "" "" {
                    softwareSystemInstance s3
                }
            }

        }

        deploymentEnvironment "Live" {
            deploymentNode "User's mobile device" "" "Apple iOS or Android" {
                liveMobileAppInstance = containerInstance mobileApp
            }
            deploymentNode "User's computer" "" "Microsoft Windows or Apple macOS" {
                deploymentNode "Web Browser" "" "Chrome, Firefox, Safari, or Edge" {
                    liveSinglePageApplicationInstance = containerInstance singlePageApplication
                }
            }

            deploymentNode "PupCle" "" "PupCle data center" {
                deploymentNode "bigbank-api***" "" "Ubuntu 16.04 LTS" "" 8 {
                    deploymentNode "Apache Tomcat" "" "Apache Tomcat 8.x" {
                        liveApiServiceInstance = containerInstance apiService
                    }
                }

                deploymentNode "bigbank-db01" "" "Ubuntu 16.04 LTS" {
                    primaryDatabaseServer = deploymentNode "Oracle - Primary" "" "Oracle 12c" {
                        livePrimaryDatabaseInstance = containerInstance database
                    }
                }
                deploymentNode "bigbank-db02" "" "Ubuntu 16.04 LTS" "Failover" {
                    secondaryDatabaseServer = deploymentNode "Oracle - Secondary" "" "Oracle 12c" "Failover" {
                        liveSecondaryDatabaseInstance = containerInstance database "Failover"
                    }
                }
                deploymentNode "bigbank-prod001" "" "" "" {
                    softwareSystemInstance s3
                }
            }

            primaryDatabaseServer -> secondaryDatabaseServer "Replicates data to"
        }
    }

    views {
        systemlandscape "SystemLandscape" {
            include *
            autoLayout
        }

        systemcontext pupcleSystem "SystemContext" {
            include *
            animation {
                pupcleSystem
                user
                s3
                email
            }
            autoLayout
        }

        container pupcleSystem "Containers" {
            include *
            animation {
                user s3 email kakaoMap
                singlePageApplication
                mobileApp
                apiService
                workerService
                database
            }
        }

        component apiService "Components" {
            include *
            animation {
                singlePageApplication mobileApp database email s3
                signinController securityComponent
                accountsSummaryController s3Client
                resetPasswordController emailComponent
            }
            autoLayout
        }

        image s3Client "MainframeBankingSystemFacade" {
            image https://raw.githubusercontent.com/structurizr/examples/main/dsl/big-bank-plc/internet-banking-system/mainframe-banking-system-facade.png
            title "[Code] S3 Object Storage Facade"
        }

        dynamic apiService "SignIn" "Summarises how the sign in feature works in the single-page application." {
            singlePageApplication -> signinController "Submits credentials to"
            signinController -> securityComponent "Validates credentials using"
            securityComponent -> database "select * from users where username = ?"
            database -> securityComponent "Returns user data to"
            securityComponent -> signinController "Returns true if the hashed password matches"
            signinController -> singlePageApplication "Sends back an authentication token to"
            autoLayout
        }

        deployment pupcleSystem "Development" "DevelopmentDeployment" {
            include *
            animation {
                developerSinglePageApplicationInstance
                developerApiServiceInstance
                developerDatabaseInstance
            }
            autoLayout
        }

        deployment pupcleSystem "Live" "LiveDeployment" {
            include *
            animation {
                liveSinglePageApplicationInstance
                liveMobileAppInstance
                liveApiServiceInstance
                livePrimaryDatabaseInstance
                liveSecondaryDatabaseInstance
            }
            autoLayout
        }

        styles {
            element "Person" {
                color #ffffff
                fontSize 22
                shape Person
            }
            element "Pet Owner" {
                background #08427b
            }
            element "Bank Staff" {
                background #999999
            }
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "Existing System" {
                background #999999
                color #ffffff
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "Web Browser" {
                shape WebBrowser
            }
            element "Mobile App" {
                shape MobileDeviceLandscape
            }
            element "Database" {
                shape Cylinder
            }
            element "Component" {
                background #85bbf0
                color #000000
            }
            element "Failover" {
                opacity 25
            }
        }
    }
}
