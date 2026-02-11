import React from "react";
import AppShell from "../General/AppShell";
import classes from "./Blog.module.css"

const Blog = () => {
    return (
        <>
        <AppShell
            selectedIndex={2}
            component={
                <div className={classes.blog}>
                <p>
                    Blog Page
                </p>
                </div>
            }
        />
        </>
    );
}

export default Blog;
