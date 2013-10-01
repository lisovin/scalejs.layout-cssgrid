%lex
%%
\s+   return 'SPACE'
[0-9]+  return 'NUMBER'
[aA][uU][tT][oO]  return 'AUTO'
[pP][xX]    return 'PX'
[fF][rR]    return 'FR'
$     return 'EOF'

/lex

%%

start
    : tokens EOF
        { 
            var result = $1
                .filter(function (track) { return track; })
                .map(function (track, i) { track.index = i + 1; return track; });
            //console.log(result);
            return result;
        }
    ;

tokens:
    t
        { $$ = [$1]; }
    | tokens SPACE t
        { 
            $$ = $1.concat($3); 
        }
    ;

t:
    | NUMBER PX
        { $$ = { type: 'px', size : parseInt($1, 10) }; }
    | NUMBER FR
        { $$ = { type: 'fr', size: parseInt($1, 10) }; }
    | AUTO
        { $$ = { type: 'keyword', size : 'auto' }; }
    ;

