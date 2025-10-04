import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Circle, Grid3x3, Pizza, Hexagon, Square, Sparkles, Search } from 'lucide-react';

interface AuthenticationDisplayProps {
  challenge: any;
  isTransitioning?: boolean;
}

export function AuthenticationDisplay({ challenge, isTransitioning = false }: AuthenticationDisplayProps) {
  const [selectedLayout, setSelectedLayout] = useState<'orb' | 'pizza' | 'honeycomb' | 'spiral' | 'unicode'>('orb');
  const [hoveredChar, setHoveredChar] = useState<string | null>(null);
  const [searchChar, setSearchChar] = useState<string>('');

  const getColorClass = (color: string, isHovered: boolean = false, isHighlighted: boolean = false) => {
    const opacity = isHovered || isHighlighted ? '100' : '90';
    const shadow = isHovered || isHighlighted ? 'shadow-2xl' : 'shadow-lg';
    const scale = isHighlighted ? 'scale-125 ring-4 ring-white z-10' : 'hover:scale-110';

    switch (color?.toLowerCase()) {
      case 'red':
        return `bg-gradient-to-br from-red-400 to-red-600 ${shadow} shadow-red-500/50 text-white hover:from-red-500 hover:to-red-700 ${scale}`;
      case 'green':
        return `bg-gradient-to-br from-green-400 to-green-600 ${shadow} shadow-green-500/50 text-white hover:from-green-500 hover:to-green-700 ${scale}`;
      case 'blue':
        return `bg-gradient-to-br from-blue-400 to-blue-600 ${shadow} shadow-blue-500/50 text-white hover:from-blue-500 hover:to-blue-700 ${scale}`;
      case 'yellow':
        return `bg-gradient-to-br from-yellow-400 to-yellow-600 ${shadow} shadow-yellow-500/50 text-white hover:from-yellow-500 hover:to-yellow-700 ${scale}`;
      default:
        return `bg-gradient-to-br from-gray-400 to-gray-600 ${shadow} shadow-gray-500/50 text-white hover:from-gray-500 hover:to-gray-700 ${scale}`;
    }
  };

  const getCharColor = (char: string) => {
    if (!challenge.colorGroups) return 'gray';
    for (const [color, chars] of Object.entries(challenge.colorGroups)) {
      if ((chars as string[]).includes(char)) {
        return color;
      }
    }
    return 'gray';
  };

  // 2D Orb Layout - Characters arranged in a circular pattern
  const OrbLayout = () => {
    const gridChars = challenge.grid.split('');
    const radius = 200;
    const centerX = 250;
    const centerY = 250;

    // Group characters by color for better organization
    const colorSections: {[key: string]: string[]} = {
      red: [], green: [], blue: [], yellow: []
    };

    gridChars.forEach((char: string) => {
      const color = getCharColor(char);
      if (colorSections[color]) {
        colorSections[color].push(char);
      }
    });

    // Create circular sections for each color
    const sections = ['red', 'green', 'blue', 'yellow'];
    const anglePerSection = (2 * Math.PI) / sections.length;

    return (
      <div className="relative w-[500px] h-[500px] mx-auto">
        <svg viewBox="0 0 500 500" className="w-full h-full">
          {/* Background circles for each color section */}
          {sections.map((color, sectionIndex) => {
            const startAngle = sectionIndex * anglePerSection - Math.PI / 2;
            const endAngle = (sectionIndex + 1) * anglePerSection - Math.PI / 2;

            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);

            const pathData = `
              M ${centerX} ${centerY}
              L ${x1} ${y1}
              A ${radius} ${radius} 0 0 1 ${x2} ${y2}
              Z
            `;

            return (
              <path
                key={color}
                d={pathData}
                fill={color === 'red' ? '#fee2e2' :
                      color === 'green' ? '#dcfce7' :
                      color === 'blue' ? '#dbeafe' : '#fef3c7'}
                opacity="0.3"
                stroke={color === 'red' ? '#ef4444' :
                        color === 'green' ? '#22c55e' :
                        color === 'blue' ? '#3b82f6' : '#eab308'}
                strokeWidth="2"
              />
            );
          })}

          {/* Place characters in their sections */}
          {sections.map((color, sectionIndex) => {
            const chars = colorSections[color] || [];
            const startAngle = sectionIndex * anglePerSection - Math.PI / 2;
            const sectionAngle = anglePerSection;

            return chars.map((char, charIndex) => {
              const charRadius = radius * (0.5 + (charIndex / chars.length) * 0.4);
              const charAngle = startAngle + (sectionAngle * (charIndex + 0.5) / chars.length);
              const x = centerX + charRadius * Math.cos(charAngle);
              const y = centerY + charRadius * Math.sin(charAngle);

              return (
                <g key={`${color}-${charIndex}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r="20"
                    className={getColorClass(color, hoveredChar === char, searchChar === char)}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  <text
                    x={x}
                    y={y + 7}
                    textAnchor="middle"
                    className="text-2xl font-bold fill-white cursor-pointer select-none"
                    onMouseEnter={() => setHoveredChar(char)}
                    onMouseLeave={() => setHoveredChar(null)}
                  >
                    {char}
                  </text>
                </g>
              );
            });
          })}
        </svg>

        {/* Color Legend */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Up</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Down</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Left</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Right</span>
          </div>
        </div>
      </div>
    );
  };

  // Pizza Slice Layout - Characters arranged in pizza-like slices
  const PizzaLayout = () => {
    const gridChars = challenge.grid.split('');
    const colors = ['red', 'green', 'blue', 'yellow'];

    // Group characters by color
    const colorSections: {[key: string]: string[]} = {};
    colors.forEach(color => colorSections[color] = []);

    gridChars.forEach((char: string) => {
      const color = getCharColor(char);
      if (colorSections[color]) {
        colorSections[color].push(char);
      }
    });

    return (
      <div className="relative w-[500px] h-[500px] mx-auto">
        <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl">
          {colors.map((color, index) => {
            const rotation = index * 90;
            const chars = colorSections[color];

            return (
              <div
                key={color}
                className="absolute inset-0"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <div className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left">
                  <div className={`w-full h-full bg-gradient-to-tr ${
                    color === 'red' ? 'from-red-100 to-red-200' :
                    color === 'green' ? 'from-green-100 to-green-200' :
                    color === 'blue' ? 'from-blue-100 to-blue-200' :
                    'from-yellow-100 to-yellow-200'
                  } border-r-2 border-b-2 border-white`}>
                    <div className="flex flex-wrap gap-2 p-4 justify-center items-center h-full">
                      {chars.map((char, charIndex) => (
                        <div
                          key={charIndex}
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transform transition-all duration-200 cursor-pointer ${
                            getColorClass(color, hoveredChar === char, searchChar === char)
                          }`}
                          style={{ transform: `rotate(-${rotation}deg)` }}
                          onMouseEnter={() => setHoveredChar(char)}
                          onMouseLeave={() => setHoveredChar(null)}
                        >
                          {char}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Center circle with pizza icon */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full border-4 border-amber-400 flex items-center justify-center">
            <Pizza className="w-10 h-10 text-amber-600" />
          </div>
        </div>
      </div>
    );
  };

  // Honeycomb Layout - Hexagonal grid pattern
  const HoneycombLayout = () => {
    const gridChars = challenge.grid.split('');
    const hexSize = 35;
    const hexHeight = hexSize * 2;
    const hexWidth = Math.sqrt(3) * hexSize;

    return (
      <div className="flex flex-wrap justify-center gap-1 max-w-[600px] mx-auto">
        {gridChars.map((char: string, index: number) => {
          const color = getCharColor(char);
          const row = Math.floor(index / 8);
          const col = index % 8;
          const offset = row % 2 === 0 ? 0 : hexWidth / 2;

          return (
            <div
              key={index}
              className={`relative ${row % 2 === 0 ? '' : 'ml-[30px]'}`}
              style={{ width: `${hexWidth}px`, height: `${hexHeight}px` }}
            >
              <div className="absolute inset-0">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon
                    points="50,5 90,25 90,75 50,95 10,75 10,25"
                    className={getColorClass(color, hoveredChar === char, searchChar === char)}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  <text
                    x="50"
                    y="55"
                    textAnchor="middle"
                    className="text-3xl font-bold fill-white cursor-pointer select-none"
                    onMouseEnter={() => setHoveredChar(char)}
                    onMouseLeave={() => setHoveredChar(null)}
                  >
                    {char}
                  </text>
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Spiral Layout - Characters in a spiral pattern
  const SpiralLayout = () => {
    const gridChars = challenge.grid.split('');
    const centerX = 250;
    const centerY = 250;
    const spiralGrowth = 15;

    return (
      <div className="relative w-[500px] h-[500px] mx-auto">
        <svg viewBox="0 0 500 500" className="w-full h-full">
          {gridChars.map((char: string, index: number) => {
            const angle = index * 0.5;
            const radius = spiralGrowth * Math.sqrt(index);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            const color = getCharColor(char);

            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="22"
                  className={getColorClass(color, hoveredChar === char)}
                  style={{ transition: 'all 0.3s ease' }}
                />
                <text
                  x={x}
                  y={y + 7}
                  textAnchor="middle"
                  className="text-xl font-bold fill-white cursor-pointer select-none"
                  onMouseEnter={() => setHoveredChar(char)}
                  onMouseLeave={() => setHoveredChar(null)}
                >
                  {char}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Unicode Order Layout - Characters in Unicode order for faster navigation
  const UnicodeLayout = () => {
    const gridChars = challenge.grid.split('');

    // Sort characters by Unicode value and group by color
    const sortedByUnicode = [...gridChars].sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0));

    // Group sorted characters by color
    const colorGroups: {[key: string]: string[]} = {
      red: [], green: [], blue: [], yellow: []
    };

    sortedByUnicode.forEach(char => {
      const color = getCharColor(char);
      if (colorGroups[color]) {
        colorGroups[color].push(char);
      }
    });

    return (
      <div className="space-y-6 max-w-[700px] mx-auto">
        <div className="text-center text-sm text-muted-foreground">
          Characters sorted by Unicode order for faster pattern recognition
        </div>

        {Object.entries(colorGroups).map(([color, chars]) => {
          if (chars.length === 0) return null;

          const directionMap: {[key: string]: string} = {
            red: 'Up (↑)',
            green: 'Down (↓)',
            blue: 'Left (←)',
            yellow: 'Right (→)'
          };

          return (
            <div key={color} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${
                  color === 'red' ? 'bg-red-500' :
                  color === 'green' ? 'bg-green-500' :
                  color === 'blue' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`}></div>
                <span className="font-semibold text-lg">{directionMap[color]}</span>
                <span className="text-sm text-muted-foreground">
                  ({chars.length} characters)
                </span>
              </div>

              <div className={`p-4 rounded-lg border-2 ${
                color === 'red' ? 'bg-red-50 dark:bg-red-900/20 border-red-300' :
                color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border-green-300' :
                color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300' :
                'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300'
              }`}>
                <div className="flex flex-wrap gap-3">
                  {chars.map((char, index) => (
                    <div
                      key={index}
                      className={`w-14 h-14 rounded-lg flex items-center justify-center font-bold text-2xl transform transition-all duration-200 cursor-pointer relative ${
                        getColorClass(color, hoveredChar === char, searchChar === char)
                      }`}
                      onMouseEnter={() => setHoveredChar(char)}
                      onMouseLeave={() => setHoveredChar(null)}
                    >
                      {char}
                      <span className="absolute -bottom-5 text-xs text-muted-foreground">
                        {char.charCodeAt(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Layout selector
  const layouts = {
    orb: <OrbLayout />,
    pizza: <PizzaLayout />,
    honeycomb: <HoneycombLayout />,
    spiral: <SpiralLayout />,
    unicode: <UnicodeLayout />
  };

  if (!challenge?.grid || !challenge?.colorGroups) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Challenge data not available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 transition-all duration-500 ${
      isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
    }`}>
      {/* Search Box for Quick Character Finding */}
      <div className="max-w-[400px] mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Type a character to highlight it..."
            value={searchChar}
            onChange={(e) => setSearchChar(e.target.value.slice(-1))} // Only take last character
            className="pl-10 text-center text-lg font-bold"
            maxLength={1}
          />
        </div>
        {searchChar && (
          <div className="text-center mt-2 text-sm text-muted-foreground">
            Highlighting: <span className="font-bold text-xl">{searchChar}</span>
            {(() => {
              const color = getCharColor(searchChar);
              return color !== 'gray' ? (
                <span className={`ml-2 px-2 py-1 rounded text-white text-xs ${
                  color === 'red' ? 'bg-red-500' :
                  color === 'green' ? 'bg-green-500' :
                  color === 'blue' ? 'bg-blue-500' :
                  color === 'yellow' ? 'bg-yellow-500' : ''
                }`}>
                  {color === 'red' ? 'Up (↑)' :
                   color === 'green' ? 'Down (↓)' :
                   color === 'blue' ? 'Left (←)' :
                   color === 'yellow' ? 'Right (→)' : ''}
                </span>
              ) : (
                <span className="ml-2 text-xs text-muted-foreground">Not found in grid</span>
              );
            })()}
          </div>
        )}
      </div>

      {/* Layout Selector */}
      <Tabs value={selectedLayout} onValueChange={(value) => setSelectedLayout(value as any)}>
        <TabsList className="grid grid-cols-5 w-full max-w-[600px] mx-auto">
          <TabsTrigger value="orb" className="flex items-center gap-1">
            <Circle className="w-4 h-4" />
            <span className="hidden sm:inline">Orb</span>
          </TabsTrigger>
          <TabsTrigger value="pizza" className="flex items-center gap-1">
            <Pizza className="w-4 h-4" />
            <span className="hidden sm:inline">Pizza</span>
          </TabsTrigger>
          <TabsTrigger value="honeycomb" className="flex items-center gap-1">
            <Hexagon className="w-4 h-4" />
            <span className="hidden sm:inline">Honeycomb</span>
          </TabsTrigger>
          <TabsTrigger value="spiral" className="flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Spiral</span>
          </TabsTrigger>
          <TabsTrigger value="unicode" className="flex items-center gap-1">
            <Grid3x3 className="w-4 h-4" />
            <span className="hidden sm:inline">Unicode</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedLayout} className="mt-6">
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-2 border-brand-green/20 shadow-2xl">
            <CardContent className="p-8">
              {layouts[selectedLayout]}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hovered Character Display */}
      {hoveredChar && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 border-2 border-brand-green/20 z-50">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{hoveredChar}</div>
            <div className="text-sm text-muted-foreground">
              Unicode: {hoveredChar.charCodeAt(0)}
            </div>
            <div className={`mt-2 px-3 py-1 rounded-full text-white text-sm font-semibold ${
              getCharColor(hoveredChar) === 'red' ? 'bg-red-500' :
              getCharColor(hoveredChar) === 'green' ? 'bg-green-500' :
              getCharColor(hoveredChar) === 'blue' ? 'bg-blue-500' :
              getCharColor(hoveredChar) === 'yellow' ? 'bg-yellow-500' :
              'bg-gray-500'
            }`}>
              {getCharColor(hoveredChar) === 'red' ? 'Up (↑)' :
               getCharColor(hoveredChar) === 'green' ? 'Down (↓)' :
               getCharColor(hoveredChar) === 'blue' ? 'Left (←)' :
               getCharColor(hoveredChar) === 'yellow' ? 'Right (→)' :
               'Unknown'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}